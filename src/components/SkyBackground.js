import React, { Component } from "react";
import "./SkyBackground.css";

class SkyBackground extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hour: 0
    };
  }
  componentDidMount() {
    this.getHour();
    this.background_timer = setInterval(() => {
      this.getHour();
    }, 1000 * 60 * 60);
  }
  componentWillUnmount() {
    this.background_timer && clearInterval(this.background_timer);
  }

  //获取天空背景所需对应的小时
  getHour = () => {
    let now = new Date();
    this.setState({
      hour: now.getMinutes() > 10 ? now.getHours() + 1 : now.getHours()
    });
  };
  render() {
    return (
      <div
        className={`sky-gradient-${this.state.hour}`}
      />
    );
  }
}

export default SkyBackground;
