import React, { Component } from "react";

export default class Player extends Component {
  constructor(props){
    super(props)
    this.state = {
      audioStar: false,
    };
  }
  componentDidUpdate(prevProps) {
    if (prevProps.audioStar !== this.props.audioStar && this.props.audioStar) {
      this.audioStart()
    }
    if (prevProps.distance !== this.props.distance) {
      let volume = 2500 - this.props.distance > 1 ? (this.props.distance / 2500) * (this.props.distance / 2500) : 1
      volume = volume * 0.05
      this.backgroundAudio_main.volume = volume
    }
  }
  componentDidMount() {
    this.backgroundAudio_main.volume = 0.05;
  }
  audioStart = () => {
    this.backgroundAudio_main.play()
  }
  render() {
    return [
      <audio
        key="audio"
        src={"/Pinknoise.mp3"}
        ref={node => {
          this.backgroundAudio_main = node;
        }}
        loop
      />
    ];
  }
}
