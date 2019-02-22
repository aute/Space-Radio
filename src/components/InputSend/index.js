import React, { Component } from "react";
import styles from "./styles.module.css";

class InputSend extends Component {
  constructor(props) {
    super(props);
    this.state = {
      value: "",
      usable:this.props.usable
    };
  }
  componentDidMount() { }
  componentWillReceiveProps(nextProps) {
    this.setState({ usable: nextProps.usable });
  }
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
    const usable = this.state.usable
    return (
      <div className={styles.input_send}>
        <input type="text" onChange={this.onChange} onKeyDown={this.onKeyDown} />
        <button className={!usable && styles.noUsableButton}>&nbsp;send&nbsp;</button>
      </div>
    );
  }
}

export default InputSend;
