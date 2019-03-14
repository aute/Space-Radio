import React, { Component } from "react";
import Tone from "tone";

export default class Player extends Component {
  constructor(props) {
    super(props);
    this.state = {
      audioStar: false,
      markDistance: 2200,
      ISSPassing: false
    };
    this.backgroundAudio = new Tone.Noise("pink").toMaster();
    this.musicAudio = new Tone.Player("./1.mp3").toMaster();
    this.test = 2200;
  }
  componentDidMount() {
    this.backgroundAudioInitStart();

    // this.musicAudio.autostart = true;
    // setInterval(() => {
    //   this.ISSmove(Math.abs(this.test));
    //   this.test = this.test - 20;
    // }, 1000);
  }
  componentDidUpdate(prevProps) {
    this.audioController(
      prevProps.distance,
      this.props.distance,
      this.state.markDistance
    );
    if (prevProps.audioStar !== this.props.audioStar && this.props.audioStar) {
      this.backgroundAudioInitStart();
    }
  }
  backgroundAudioInitStart = () => {
    this.backgroundAudio.start();
    this.backgroundAudio.volume.value = -20;
  };
  setBackgroundAudioVolume = value => {
    if (value > -200) {
      this.backgroundAudio.volume.value = value;
    }
  };
  setMusicAudioVolume = value => {
    if (this.musicAudio.volume) {
      this.musicAudio.volume.value = value;
    }
  };
  ISSover = () => {
    this.musicAudio.autostart = true;
  };
  ISSmove = Distance => {
    let backgroundAudioVolume =
      -Math.pow(this.state.markDistance / Distance, 9) - 20;
    let musicAudioVolume = -(
      2 +
      Math.pow(Distance / this.state.markDistance, 5) * 60
    );
    this.setBackgroundAudioVolume(backgroundAudioVolume);
    this.setMusicAudioVolume(musicAudioVolume);
  };
  ISSout = () => {
    this.setBackgroundAudioVolume(-1);
    // this.musicAudio
  };

  audioController = (prevPropsDistance, thisPropsDistance, markDistance) => {
    if (
      prevPropsDistance !== thisPropsDistance &&
      markDistance - thisPropsDistance > 0
    ) {
      if (!this.state.ISSPassing) {
        this.ISSover();
        this.setState({
          ISSPassing: true
        });
      }
      this.ISSmove(thisPropsDistance);
    }
    // Iss Out
    if (
      prevPropsDistance !== thisPropsDistance &&
      markDistance - thisPropsDistance <= 0
    ) {
      if (!this.state.ISSPassing) {
        this.ISSout();
        this.setState({
          ISSPassing: false
        });
      }
    }
  };
  render() {
    return <div />;
  }
}
