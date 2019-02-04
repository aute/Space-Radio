// server.js
const Koa = require("koa");
const path = require("path");
const static = require("koa-static");

const app = new Koa();

app.use(static(path.join(__dirname, "../build")));

const server =  app.listen(80, () => {
  console.log("Listening 80...");
});

const io = require("socket.io")(server);

io.on('connection', function (socket) {
  socket.emit('news', { hello: 'world' });
  socket.on('event', function (data) {
    console.log(data);
  });
});