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
    if (!(2400 - prevProps.distance > 0) && 2400 - this.props.distance > 0) {
      this.audio.play()
    }
    if (2400 - prevProps.distance > 0 && !(2400 - this.props.distance > 0)) {
      this.audio.pause()
    }
    if (prevProps.distance !== this.props.distance) {
      let backgroundAudioVolume =
        2400 - this.props.distance > 0
          ? Math.pow(this.props.distance / 2400, 4)
          : 1;
      backgroundAudioVolume = backgroundAudioVolume * 0.05;

      let audioVolume =
      2400 - this.props.distance > 0
        ? 1 - Math.pow(this.props.distance / 2400, 2)
        : 0;

      this.backgroundAudio_main.volume = backgroundAudioVolume;
      this.audio.volume = audioVolume;
    }
  }
  componentDidMount() {
    this.backgroundAudio_main.volume = 0.05;
  }
  audioStart = () => {
    this.backgroundAudio_main.play();
  };
  render() {
    return (
      <div>
        <audio
          src={"/1.mp3"}
          ref={node => {
            this.audio = node;
          }}
          loop
        />
        <audio
          src={"/Pinknoise.mp3"}
          ref={node => {
            this.backgroundAudio_main = node;
          }}
          loop
        />
      </div>
    )
  }
}
