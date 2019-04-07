import React, { Component } from "react";
import screenfull from "screenfull";
import fetchJsonp from "fetch-jsonp";
import { observer } from "mobx-react";
import { LatLonSpherical } from "geodesy";
import "./App.css";
import Loading from "./components/Loading/";
import InputSend from "./components/InputSend/";
import ISS from "./components/ISS/"
import SkyBackground from "./components/SkyBackground/";
import Header from "./components/Header/";
import Menu from "./components/Menu/";
import Sider from "./components/Sider/";
import ForecastBoard from "./components/ForecastBoard/";
import Messages from "./components/Messages/";
import Player from "./components/Player/";
import { ISSStore } from "./mobx/store";
@observer
class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      audioStart: false,
      menuOpen: false
    };
  }
  componentDidMount() {}
  start = () => {
    this.setState({
      audioStart: true
    });
    // if (screenfull.enabled) {
    //   screenfull.toggle(this.refs.App);
    // }
  };
  render() {
    return (
      <div className={"App"} ref="App">
        <SkyBackground />
        <Loading
          onTouchEnd={this.start}
          onClick={this.start}
          hidden={this.state.audioStart}
          ok={ISSStore.ISStoreInit}
        />
        <ISS {...ISSStore} />
        <Player
          distance={Math.round(ISSStore.ISSDistance)}
          audioStar={this.state.audioStart}
        />
        <Header
          onChange={e => {
            this.setState({
              menuOpen: e
            });
          }}
          menuOpen={this.state.menuOpen}
        />
        {this.state.menuOpen && <Menu />}
        <Sider menuOpen={this.state.menuOpen}>
          <ForecastBoard
            distance={ISSStore.ISSDistance}
            duration={ISSStore.duration}
            risetime={ISSStore.risetime}
          />
          <footer>
            <Messages usable={ISSStore.iss_passing} socket={socket} />
            <InputSend
              usable={ISSStore.iss_passing}
              placeholder={LatLonSpherical(ISSStore.loca_lat,ISSStore.loca_lng).toString()}
              socket={socket}
            />
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
