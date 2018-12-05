import React, { Component } from "react";

export default class Player extends Component {
  constructor(props) {
    super(props);
    this.state = {
      audioStar: false,
      markDistance: 2200
    };
  }
  componentDidUpdate(prevProps) {
    let p_audioStar = prevProps.audioStar
    let c_audioStar = this.props.audioStar
    let p_distance = prevProps.distance
    let c_distance = this.props.distance
    let markDistance = this.state.markDistance

    if (p_audioStar !== c_audioStar && c_audioStar) {
      this.audioStart();
    }

    if (!(markDistance - p_distance > 0) && markDistance - c_distance > 0) {
      this.audio.play()
    }

    if (markDistance - p_distance > 0 && !(markDistance - c_distance > 0)) {
      this.audio.pause()
    }

    if (prevProps.distance !== c_distance) {
      let backgroundAudioVolume =
        markDistance - c_distance > 0
          ? Math.pow(c_distance / markDistance, 4)
          : 1;
      backgroundAudioVolume = backgroundAudioVolume * 0.2;

      let audioVolume =
      markDistance - c_distance > 0
        ? 1 - Math.pow(c_distance / markDistance, 2)
        : 0;

      this.backgroundAudio_main.volume = backgroundAudioVolume;
      this.audio.volume = audioVolume;
    }
  }
  componentDidMount() {
    this.backgroundAudio_main.volume = 0.2;
  }
  audioStart = () => {
    this.backgroundAudio_main.play();
  };
  render() {
    return (
      <div>
        <audio
          src={"./1.mp3"}
          ref={node => {
            this.audio = node;
          }}
          loop
        />
        <audio
          src={"./b.mp3"}
          ref={node => {
            this.backgroundAudio_main = node;
          }}
          loop
        />
      </div>
    )
  }
}
