import React, { Component } from "react";
import Tone from 'tone'

export default class Player extends Component {
  constructor(props) {
    super(props);
    this.state = {
      audioStar: false,
      markDistance: 2300,
      ISSPassing: false,
    };
    this.backgroundAudio = new Tone.Noise("pink").toMaster()
    this.musicAudio = new Tone.Player("./1.mp3").toMaster()
  }
  componentDidMount() {
  }
  componentDidUpdate(prevProps) {
    this.audioController(
      prevProps.distance,
      this.props.distance,
      this.state.markDistance
    );
    if (prevProps.audioStar !== this.props.audioStar && this.props.audioStar) {
      this.backgroundAudioInitStart()
    }
  }
  backgroundAudioInitStart = () => {
    this.backgroundAudio.volume.value = -1
    this.backgroundAudio.start()
  };
  setBackgroundAudioVolume = (value) => {
    if (value < -500) {
      value =  -500
    }
    this.backgroundAudio.volume.value = value
  }
  setMusicAudioVolume = (value) => {
    this.musicAudio.volume.value = value
  }
  ISSover = () => {
    this.musicAudio.start()
  }
  ISSmove = (Distance) => {
    let backgroundAudioVolume = -(Math.pow(this.state.markDistance / Distance, 9))
    let musicAudioVolume = -501 - backgroundAudioVolume
    this.setBackgroundAudioVolume(backgroundAudioVolume)
    this.setMusicAudioVolume(musicAudioVolume)
  }
  ISSout = () => {
    this.setBackgroundAudioVolume(-1)
    this.musicAudio
  }

  audioController = (
    prevPropsDistance,
    thisPropsDistance,
    markDistance,
  ) => {
    if (prevPropsDistance !== thisPropsDistance && markDistance - thisPropsDistance > 0) {
      if (!this.state.ISSPassing) {
        this.ISSover()
        this.setState({
          ISSPassing:true
        })
      }
      this.ISSmove()
    }
    // Iss Out
    if (prevPropsDistance !== thisPropsDistance && markDistance - thisPropsDistance <= 0) {
      if (!this.state.ISSPassing) {
        this.ISSout()
        this.setState({
          ISSPassing:false
        })
      }
    }
  };
  render() {
    return (
      <div>
      </div>
    );
  }
}
