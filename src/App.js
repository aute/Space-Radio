import React, { Component } from "react";
import screenfull from "screenfull";
import fetchJsonp from "fetch-jsonp";
import io from "socket.io-client";
import "./App.css";
import { GetISSDistance } from "./utils";
import Loading from "./components/Loading";
import InputSend from "./components/InputSend";
import SkyBackground from "./components/SkyBackground";
import ForecastBoard from "./components/ForecastBoard";
import Player from "./components/Player";

const socket = io();
const getLoca = () => {
  // eslint-disable-next-line
  const geolocation = new qq.maps.Geolocation(
    "MPFBZ-TPZW4-AWOU3-XG2RL-3VE47-MSFIE",
    "Outer Space Radio"
  );
  return new Promise((resolve, reject) => {
    geolocation.getLocation(payload => {
      resolve({
        lat: payload.lat,
        lng: payload.lng
      });
    });
  });
};

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loca_lat: 0,
      loca_lng: 0,
      iss_lat: 0,
      iss_lng: 0,
      distance: 0,
      risetime: 0,
      duration: 0,
      LocaOK: false,
      IssPositionOk: false,
      IssPassOK: false,
      AudioOK: false,
      currentDuration: 0,
      passing: false,
      audioStart: false
    };
  }
  componentDidMount() {
    this.init()
  }
  init = () => {
    socket.on("issPositionChange", data => {
      this.setIssPosition(data);
      this.checkIssPass();
    });

    //接收广播信息
    socket.on("hello", data => {
      this.setState({
        text: data
      });
    });
    getLoca().then(value => {
      socket.emit("join", {
        lat: value.lat,
        lng: value.lng
      });
      this.setState({
        loca_lat: value.lat,
        loca_lng: value.lng,
        LocaOK: true
      });
    });
  };

  // 设置 ISS 当前位置状态信息
  setIssPosition = data => {
    this.setState(
      {
        iss_lat: data.latitude,
        iss_lng: data.longitude
      },
      () => {
        this.setState({
          distance: GetISSDistance(
            this.state.loca_lat,
            this.state.loca_lng,
            this.state.iss_lat,
            this.state.iss_lng
          ),
          IssPositionOk: this.state.LocaOK ? true : false
        });
      }
    );
  };

  // 检查下一次通过信息是否过时,若过时便更新
  checkIssPass = () => {
    if (this.state.risetime - new Date() < 0) {
      if (!this.state.passing) {
        this.animationStart(this.state.duration);
      }
      this.getIssPass();
    }
  };

  getIssPass = () => {
    fetchJsonp(
      `http://api.open-notify.org/iss-pass.json?lat=${
        this.state.loca_lat
      }&lon=${this.state.loca_lng}&`
    ).then(res => {
      res.json().then(data => {
        this.setState({
          duration: data.response[0].duration,
          risetime: data.response[0].risetime * 1000,
          IssPassOK: this.state.LocaOK ? true : false
        });
      });
    });
  };
  start = () => {
    this.setState({
      audioStart: true
    });
    if (screenfull.enabled) {
      screenfull.toggle(this.refs.App);
    }
  };
  animationStart = duration => {
    this.setState({
      passing: true,
      currentDuration: duration
    });
    let durationTimer = setInterval(() => {
      if (duration > 1) {
        duration--;
      } else {
        this.setState({
          passing: false,
          currentDuration: 0
        });
        clearInterval(durationTimer);
      }
    }, 1000);
  };
  render() {
    return (
      <div className={"App"} ref="App">
        <SkyBackground />
        {/* <Loading onTouchEnd={this.start} onClick={this.start} hidden={this.state.audioStart} ok={this.state.IssPassOK}/> */}
        <div
          className={[
            "circle-container",
            this.state.passing ? "passing" : ""
          ].join(" ")}
          style={{ animationDuration: `${this.state.currentDuration}s` }}
        >
          <div
            className="circle"
            style={{ animationDuration: `6s,${this.state.currentDuration}s` }}
          />
        </div>
        <Player
          distance={Math.round(this.state.distance)}
          audioStar={this.state.audioStart}
          onCanPlay={e => {
            this.setState({
              AudioOK: true
            });
          }}
        />
        <div className="container">
          <div>
            <h1 style={{ color: "#fff" }}>{this.state.text}</h1>
          </div>
          <div>
            <ForecastBoard
              distance={Math.round(this.state.distance)}
              duration={this.state.duration}
              risetime={this.state.risetime}
            />
            <InputSend socket={socket} />
          </div>
        </div>
      </div>
    );
  }
  componentWillUnmount() {
    this.getIssPosition_timer && clearInterval(this.getIssPosition_timer);
  }
}

export default App;
