// server.js
const Koa = require("koa");
const path = require("path");
const static = require("koa-static");
var request = require("request");

const app = new Koa();
const state = {
  issNow: null
};

app.use(static(path.join(__dirname, "../build")));

const server = app.listen(80, () => {
  console.log("Listening 80...");
});

const io = require("socket.io")(server);

// io.on("connection", function(socket) {
// });

function updateIssNow() {
  return request.get("http://api.open-notify.org/iss-now.json", function(
    error,
    response,
    body
  ) {
    if (!error && response.statusCode == 200) {
      state.issNow = JSON.parse(body).iss_position;
      io.emit("issPositionChange", state.issNow);
    }
  });
}
const timer = setInterval(() => {
  updateIssNow();
}, 1000);
