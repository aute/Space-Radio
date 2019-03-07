// server.js
const Koa = require("koa");
const path = require("path");
const static = require("koa-static");
const request = require("request");
const uuidv4 = require("uuid/v4");
const GetISSDistance = require("./utils/GetISSDistance");
const app = new Koa();
const state = {
  issNow: null,
  userList: []
};

app.use(static(path.join(__dirname, "../build")));

const server = app.listen(80, () => {
  console.log("Listening 80...");
});

const io = require("socket.io")(server);

io.on("connection", function(socket) {
  const info = {
    lat: undefined,
    lng: undefined,
    socket: null
  };
  socket.on("join", data => {
    info.lat = data.lat;
    info.lng = data.lng;
    info.socket = socket;
    state.userList.push(info);
  });
  socket.on("helloWorld", data => {
    state.userList.map(item => {
      const distance = GetISSDistance(
        item.lat,
        item.lng,
        state.issNow.latitude,
        state.issNow.longitude
      );
      // 开发阶段 大于小于反向 方便测试
      if (distance > 2300) {
        item.socket.emit("hello",{
          lat:item.lat,
          lng: item.lng,
          text: data,
          message_key: uuidv4()
        });
      }
    });
  });
});

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
}, 3000);