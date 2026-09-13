const Koa = require("koa");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { randomUUID } = require("node:crypto");
const serveStatic = require("koa-static");
const { radioDistance: GetISSDistance, validCoordinates } = require("../shared/radio.cjs");
const { createOrbitService } = require("./orbit");
const { Server } = require("socket.io");

function readPlaylist(directory, prefix = "") {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) return readPlaylist(path.join(directory, entry.name), relative);
    return /\.mp3$/i.test(entry.name) ? [`./musicList/${relative}`] : [];
  });
}

// Export a lifecycle-managed server so development and tests can share it.
function createRadioServer(options = {}) {
  const app = new Koa();
  const orbit = options.orbit || createOrbitService();
  app.use(async (ctx, next) => {
    if (ctx.path === "/api/iss/position") {
      const time = Number(ctx.query.time);
      // Bound rehearsal propagation to the same two-day forecast horizon.
      if (typeof ctx.query.time !== "string" || !ctx.query.time.trim() || !Number.isFinite(time) || Math.abs(time - Date.now()) > 2 * 86400000) {
        ctx.status = 400;
        ctx.body = { error: "Invalid prediction time" };
        return;
      }
      try { ctx.body = await orbit.position(time); }
      catch { ctx.status = 503; ctx.body = { error: "ISS prediction unavailable" }; }
      return;
    }
    if (ctx.path === "/api/iss/passes") {
      const { lat: rawLat, lon: rawLon } = ctx.query;
      const lat = Number(rawLat);
      const lon = Number(rawLon);
      if (typeof rawLat !== "string" || !rawLat.trim() || typeof rawLon !== "string" || !rawLon.trim() || !validCoordinates(lat, lon)) {
        ctx.status = 400;
        ctx.body = { error: "Invalid coordinates" };
        return;
      }
      try {
        ctx.body = { response: await orbit.passes(lat, lon) };
      } catch {
        ctx.status = 503;
        ctx.body = { error: "ISS predictions are temporarily unavailable. Please retry." };
      }
      return;
    }
    await next();
  });
  app.use(serveStatic(path.join(__dirname, "../build")));
  const server = http.createServer(app.callback());
  const io = new Server(server, { maxHttpBufferSize: 16384 });
  const users = new Map();
  let position = null;
  let timer;
  let updating = false;
  let closed = false;
  let warned = false;
  const logger = options.logger || console;

  io.on("connection", socket => {
    if (position) socket.emit("issPositionChange", position);
    socket.emit("playList", readPlaylist(path.join(__dirname, "../public/musicList")));
    socket.on("join", (data, acknowledge) => {
      if (!data || !validCoordinates(data.lat, data.lng)) return;
      users.set(socket.id, { lat: data.lat, lng: data.lng, socket });
      if (typeof acknowledge === "function") acknowledge();
    });
    socket.on("disconnect", () => users.delete(socket.id));
    socket.on("helloWorld", (text, acknowledge) => {
      // A provider outage must not crash the process before its first update.
      if (!position || !users.has(socket.id) || typeof text !== "string" || !text.trim() || text.length > 2000) {
        if (typeof acknowledge === "function") acknowledge();
        return;
      }
      for (const user of users.values()) {
        if (GetISSDistance(user.lat, user.lng, position.latitude, position.longitude) < 2250) {
          user.socket.emit("hello", {
            lat: user.lat, lng: user.lng, text, message_key: randomUUID(),
          });
        }
      }
      if (typeof acknowledge === "function") acknowledge();
    });
  });

  async function update() {
    if (updating || closed) return;
    updating = true;
    try {
      // Playlist delivery does not depend on an external satellite API.
      io.emit("playList", readPlaylist(path.join(__dirname, "../public/musicList")));
      const next = await (options.fetchPosition || (() => orbit.position()))();
      if (!next || !validCoordinates(Number(next.latitude), Number(next.longitude))) throw new Error("Invalid ISS position");
      if (!closed) {
        position = next;
        io.emit("issPositionChange", position);
        warned = false;
      }
    } catch (error) {
      if (!warned && !closed) logger.warn(`ISS update unavailable: ${error.message}`);
      warned = true;
    } finally {
      updating = false;
    }
  }

  return {
    server,
    update,
    async listen(port = 3001, host = "127.0.0.1") {
      await new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(port, host, () => {
          server.removeListener("error", reject);
          resolve();
        });
      });
      timer = setInterval(update, options.intervalMs || 3000);
    },
    async close() {
      closed = true;
      clearInterval(timer);
      users.clear();
      await new Promise(resolve => io.close(resolve));
    },
  };
}

module.exports = { createRadioServer };

if (require.main === module) {
  const radio = createRadioServer();
  const port = Number(process.env.PORT || process.env.API_PORT || 3001);
  radio.listen(port, process.env.HOST || "127.0.0.1").then(() => {
    console.log(`Space Radio server: http://localhost:${port}`);
  }).catch(async error => {
    console.error(error);
    await radio.close();
    process.exitCode = 1;
  });
  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.once(signal, async () => { await radio.close(); });
  }
}
