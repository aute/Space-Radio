import React, { Component } from "react";
import screenfull from "screenfull";
import "./App.css";
import { GetDistance } from "./utils";

import ForecastBoard from "./components/ForecastBoard";

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
      distance: ""
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
    }, 1000);
  }
  getHour = () => {
    let now = new Date();
    this.setState({
      hour: now.getMinutes() > 50 ? now.getHours() + 1 : now.getHours()
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
              distance: GetDistance(
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
  screenfullSwitch = () => {
    if (screenfull.enabled) {
      screenfull.toggle(this.refs.App);
    } else {
      alert("screen full error");
    }
  };
  render() {
    return (
      <div
        className={["App", `sky-gradient-${this.state.hour}`].join(" ")}
        ref="App"
      >
        <div className="container" onDoubleClick={this.screenfullSwitch}>
          <div />
          <ForecastBoard distance={Math.round(this.state.distance)} />
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
