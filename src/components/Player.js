import React, { Component } from "react";

export default class Player extends Component {
  constructor(props) {
    super(props);
    this.state = {
      audioStar: false
    };
  }
  componentDidUpdate(prevProps) {
    if (prevProps.audioStar !== this.props.audioStar && this.props.audioStar) {
      this.audioStart();
    }
    if (prevProps.distance !== this.props.distance) {
      let volume =
        2400 - this.props.distance > 1
          ? Math.pow((this.props.distance / 2400),4)
          : 1;
      volume = volume * 0.05;
      this.backgroundAudio_main.volume = volume;
    }
  }
  componentDidMount() {
    this.backgroundAudio_main.volume = 0.05;
  }
  audioStart = () => {
    this.backgroundAudio_main.play();
  };
  render() {
    return [
      <div>
        <audio
          key="audio"
          src={"/Pinknoise.mp3"}
          ref={node => {
            this.audio = node;
          }}
          loop
        />
        <audio
          key="backgroundAudio_main"
          src={"/Pinknoise.mp3"}
          ref={node => {
            this.backgroundAudio_main = node;
          }}
          loop
        />
      </div>
    ];
  }
}
