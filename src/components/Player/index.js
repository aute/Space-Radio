import React, { Component } from "react";
import io from "socket.io-client";
import Tone from "tone";

const socket = io();

export default class Player extends Component {
  constructor(props) {
    super(props);
    this.state = {
      audioStar: false,
      markDistance: 2250,
      ISSPassing: false,
      playList: []
    };
    this.backgroundAudio = new Tone.Noise("pink").toMaster();
    this.test = 2250;
  }
  componentDidMount() {
    socket.on("playList", data => {
      this.setState({
        playList: data
      });
    });
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
  radioStart = oldList => {
    if (this.state.playList.length && this.state.ISSPassing) {
      oldList = oldList ? oldList : []
      let playList = this.state.playList.filter(i => {
        return  oldList.indexOf(i) === -1
      })
      if (playList.length < 1) {
        playList = oldList
        oldList=[]
      }
      const currentMusic = playList[Math.floor(Math.random() * playList.length)];
      oldList.push(currentMusic)
      this.musicAudio = new Tone.Player(currentMusic, () => {
        this.musicAudio.start();
        Tone.Transport.scheduleOnce(() => {
          this.musicAudio.dispose();
          this.radioStart(oldList);
        }, Tone.Transport.seconds + this.musicAudio.buffer.duration);
        Tone.Transport.start();
      }).toMaster();
      this.setMusicAudioVolume(-42);
    } else if (this.state.ISSPassing) {
      setTimeout(() => {
        this.radioStart();
      }, 1000 * 3);
    }
  };
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
    if (this.musicAudio && this.musicAudio.volume) {
      this.musicAudio.volume.value = value;
    }
  };
  ISSover = () => {
    this.radioStart();
  };
  ISSmove = Distance => {
    let backgroundAudioVolume =
      -Math.pow((this.state.markDistance - Distance)/60, 1.5) - 20;
    let musicAudioVolume = -(
      2 +
      Math.pow(Distance / this.state.markDistance, 12) * 40
    );
    this.setBackgroundAudioVolume(backgroundAudioVolume);
    this.setMusicAudioVolume(musicAudioVolume);
  };
  ISSout = () => {
    this.setBackgroundAudioVolume(-20);
    // this.musicAudio
  };

  audioController = (prevPropsDistance, thisPropsDistance, markDistance) => {
    if (
      prevPropsDistance !== thisPropsDistance &&
      markDistance - thisPropsDistance > 0
    ) {
      if (!this.state.ISSPassing) {
        this.setState({
          ISSPassing: true
        }, () => {
          this.ISSover();
        });
      }
      this.ISSmove(thisPropsDistance);
    }
    // Iss Out
    if (
      prevPropsDistance !== thisPropsDistance &&
      markDistance - thisPropsDistance <= 0
    ) {
      if (this.state.ISSPassing) {
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
