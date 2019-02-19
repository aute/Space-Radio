import React, { Component } from "react";
import styles from "./styles.module.css";

class InputSend extends Component {
  constructor(props) {
    super(props);
    this.state = {
      value: ""
    };
  }
  componentDidMount() {}
  onChange = event => {
    this.setState({
      value: event.target.value
    });
  };
  onKeyDown = event => {
    if (event.keyCode === 13) {
      this.props.socket.emit("helloWorld", this.state.value);
    }
  };
  render() {
    return (
      <div className={styles.input_send}>
        <input type="text" onChange={this.onChange} onKeyDown={this.onKeyDown} />
        <button>send</button>
      </div>
    );
  }
}

export default InputSend;
