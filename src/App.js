import React, { Component } from "react";
import screenfull from "screenfull";
import fetchJsonp from "fetch-jsonp";
import "./App.css";
import { GetDistance } from "./utils";

import ForecastBoard from "./components/ForecastBoard";
import Player from "./components/Player.js";

// eslint-disable-next-line
const geolocation = new qq.maps.Geolocation(
  "MPFBZ-TPZW4-AWOU3-XG2RL-3VE47-MSFIE",
  "Outer Space Radio"
);

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hour: 0,
      loca_lat: 0,
      loca_lng: 0,
      iss_lat: 0,
      iss_lng: 0,
      distance: 0,
      risetime: 0,
      duration: 0,
      currentDuration: 0,
      passing: false,
      audioStart: false
    };
  }
  componentDidMount() {
    this.getHour();
    this.getLoca();
    this.getIssPosition();
    this.background_timer = setInterval(() => {
      this.getHour();
    }, 1000 * 60 * 60);
    this.getIssPosition_timer = setInterval(() => {
      this.getIssPosition();
      if (this.state.risetime - new Date() < 0) {
        if (!this.state.passing) {
          this.animationStart(this.state.duration);
        }
        this.getIssPass();
      }
    }, 1000);
  }
  getHour = () => {
    let now = new Date();
    this.setState({
      hour: now.getMinutes() > 10 ? now.getHours() + 1 : now.getHours()
    });
  };
  getLoca = () => {
    geolocation.getLocation(payload => {
      this.setState({
        loca_lat: payload.lat,
        loca_lng: payload.lng
      });
    });
  };
  getIssPosition = () => {
    fetch("http://api.open-notify.org/iss-now.json").then(res => {
      res.json().then(data => {
        this.setState(
          {
            iss_lat: data.iss_position.latitude,
            iss_lng: data.iss_position.longitude
          },
          () => {
            this.setState({
              distance:
                GetDistance(
                this.state.loca_lat,
                this.state.loca_lng,
                this.state.iss_lat,
                this.state.iss_lng
              )
            });
          }
        );
      });
    });
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
          risetime: data.response[0].risetime * 1000
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
    } else {
      alert("screen full error");
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
      <div
        className={["App", `sky-gradient-${this.state.hour}`].join(" ")}
        ref="App"
      >
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
        />
        <div className="container" onDoubleClick={this.start}>
          <div />
          <ForecastBoard
            distance={Math.round(this.state.distance)}
            duration={this.state.duration}
            risetime={this.state.risetime}
          />
        </div>
      </div>
    );
  }
  componentWillUnmount() {
    this.background_timer && clearInterval(this.background_timer);
    this.getIssPosition_timer && clearInterval(this.getIssPosition_timer);
  }
}

export default App;
