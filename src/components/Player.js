import React, { Component } from "react";

export default class Player extends Component {
  constructor(props) {
    super(props);
    this.state = {
      audioStar: false,
      markDistance: 2200,
    };
  }
  componentDidUpdate(prevProps) {
    this.audioController(
      prevProps.audioStar,
      this.props.audioStar,
      prevProps.distance,
      this.props.distance,
      this.state.markDistance
    );
  }
  componentDidMount() {
    this.setBackgroundAudioVolume(0.2)
  }
  audioStart = () => {
    this.audio.play();
    this.backgroundAudio_main.play();
    this.backgroundAudio_paint.play();
    setInterval(() => {
      let currentTime = Math.ceil(Math.random() * (this.backgroundAudio_paint.duration - 5))
      this.backgroundAudio_paint.currentTime = currentTime
    }, 1000 * 5);
  };
  setBackgroundAudioVolume = (value) => {
    this.backgroundAudio_main.volume = value;
    this.backgroundAudio_paint.volume = value;
  }
  audioController = (
    p_audioStar,
    c_audioStar,
    p_distance,
    c_distance,
    markDistance,
  ) => {
    if (p_audioStar !== c_audioStar && c_audioStar) {
      this.audioStart();
    }

    if (p_distance !== c_distance && markDistance - c_distance > 0) {
      let backgroundAudioVolume =  Math.pow(c_distance / markDistance, 4)
      backgroundAudioVolume = backgroundAudioVolume * 0.2;
      let audioVolume = 1 - Math.pow(c_distance / markDistance, 2)
      this.audio.play()
      this.setBackgroundAudioVolume(backgroundAudioVolume)
      this.audio.volume = audioVolume;
    }

    if (p_distance !== c_distance && markDistance - c_distance <= 0) {
      let backgroundAudioVolume = 1;
      backgroundAudioVolume = backgroundAudioVolume * 0.2;
      let audioVolume = 0;
      this.audio.pause()
      this.setBackgroundAudioVolume(backgroundAudioVolume)
      this.audio.volume = audioVolume;
    }
  };
  render() {
    return (
      <div>
        <audio
          autoPlay={false}
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
          onLoadedMetadata={e => {
            this.props.onCanPlay(e);
          }}
          loop
        />
        <audio
          src={"./b.mp3"}
          ref={node => {
            this.backgroundAudio_paint = node;
          }}
          loop
        />
      </div>
    );
  }
}
