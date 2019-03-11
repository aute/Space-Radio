import React, { Component } from "react";
import Tone from 'tone'

export default class Player extends Component {
  constructor(props) {
    super(props);
    this.state = {
      audioStar: false,
      markDistance: 2300,
    };
    this.backgroundAudio = new Tone.Noise("pink")
    this.musicAudio = new Tone.Player("./1.mp3").toMaster()
  }
  componentDidMount() {
    //this.setBackgroundAudioVolume(0.2)
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
  audioStart = () => {
    this.audio.play()
    this.backgroundAudio.start()
    this.backgroundAudio.volume.value = -1
    this.backgroundAudio.toMaster()
    this.musicAudio.start()
    //this.backgroundAudio_main.play();
    //this.backgroundAudio_paint.play();
    // setInterval(() => {
    //   let currentTime = Math.ceil(Math.random() * (this.backgroundAudio_paint.duration - 5))
    //   this.backgroundAudio_paint.currentTime = currentTime
    // }, 1000 * 5);
  };
  setBackgroundAudioVolume = (value) => {
    if (value < -500) {
      value =  -500
    }
    this.backgroundAudio.volume.value = value
    //this.backgroundAudio_main.volume = value;
    //this.backgroundAudio_paint.volume = value;
  }
  audioController = (
    prevPropsAudioStar,
    thisPropsAudioStar,
    prevPropsDistance,
    thisPropsDistance,
    markDistance,
  ) => {
    if (prevPropsAudioStar !== thisPropsAudioStar && thisPropsAudioStar) {
      this.audioStart();
    }

    // passing
    if (prevPropsDistance !== thisPropsDistance && markDistance - thisPropsDistance > 0) {
      
      let audioVolume = 1 - Math.pow(thisPropsDistance / markDistance, 2)
      this.audio.play()
      this.audio.volume = audioVolume;
      let backgroundAudioVolume =  -(Math.pow(markDistance / thisPropsDistance,9))
      this.setBackgroundAudioVolume(backgroundAudioVolume)
    }

    if (prevPropsDistance !== thisPropsDistance && markDistance - thisPropsDistance <= 0) {
      //let backgroundAudioVolume = 1;
      //backgroundAudioVolume = backgroundAudioVolume * 0.2;
      let audioVolume = 0;
      this.audio.pause()
      //this.setBackgroundAudioVolume(backgroundAudioVolume)
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
