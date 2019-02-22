import React, { Component } from "react";
import screenfull from "screenfull";
import fetchJsonp from "fetch-jsonp";
import io from "socket.io-client";
import { observer } from "mobx-react";
import "./App.css";
import Loading from "./components/Loading";
import InputSend from "./components/InputSend/";
import SkyBackground from "./components/SkyBackground";
import Header from "./components/Header";
import Sider from "./components/Sider";
import ForecastBoard from "./components/ForecastBoard/";
import Messages from "./components/Messages";
import Player from "./components/Player";
import ISSStore from "./mobx/store";

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

@observer
class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      AudioOK: false,
      currentDuration: 0,
      passing: false,
      audioStart: false
    };
  }
  componentDidMount() {
    this.init();
  }
  init = () => {
    getLoca().then(value => {
      socket.emit("join", {
        lat: value.lat,
        lng: value.lng
      });
      ISSStore.LocaChange({
        loca_lat: value.lat,
        loca_lng: value.lng
      });
      this.getIssPass();
    });
    //接收 ISS 位置信息
    socket.on("issPositionChange", data => {
      this.updateIssMoveState(data.latitude,data.longitude);
    });

    //接收广播信息
    socket.on("hello", data => {
      this.setState({
        text: data
      });
    });
  };

  // 设置 ISS 当前移动状态信息
  updateIssMoveState = (latitude,longitude) => {
    ISSStore.ISSPositionChange({
      iss_lat: latitude,
      iss_lng: longitude
    });
    ISSStore.ISSPassingChange()
    ISSStore.iss_passing && this.getIssPass();
  };

  // 检查下一次通过信息是否过时,若过时便更新
  // checkIssPass = () => {
  //   if (!ISSStore.iss_passing) {
  //     if (!this.state.passing) {
  //       this.animationStart(ISSStore.duration);
  //     }
  //     this.getIssPass();
  //   }
  // };

  getIssPass = () => {
    fetchJsonp(
      `http://api.open-notify.org/iss-pass.json?lat=${ISSStore.loca_lat}&lon=${
        ISSStore.loca_lng
      }&`
    ).then(res => {
      res.json().then(data => {
        ISSStore.ISSPassInfoChange({
          duration: data.response[0].duration * 1000,
          risetime: data.response[0].risetime * 1000
        });
        // ISSStore.ISSPassInfoChange({
        //   duration: 7 * 1000,
        //   risetime: Date.now() + 8 * 1000
        // });
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
        {/* <Loading onTouchEnd={this.start} onClick={this.start} hidden={this.state.audioStart} ok={ISSStore.ISStoreInit}/> */}
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
          distance={Math.round(ISSStore.ISSDistance)}
          audioStar={this.state.audioStart}
          onCanPlay={e => {
            this.setState({
              AudioOK: true
            });
          }}
        />
        <Header />
        <Sider>
          <ForecastBoard
            distance={ISSStore.ISSDistance}
            duration={ISSStore.duration}
            risetime={ISSStore.risetime}
          />
          <footer>
            <Messages usable ={ISSStore.iss_passing}/>
            <InputSend usable ={ISSStore.iss_passing} socket={socket} />
          </footer>
        </Sider>
      </div>
    );
  }
  componentWillUnmount() {
    this.getIssPosition_timer && clearInterval(this.getIssPosition_timer);
  }
}

export default App;
