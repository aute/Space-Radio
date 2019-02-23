import React, { Component } from "react";
import styles from "./styles.module.css";

class InputSend extends Component {
  constructor(props) {
    super(props);
    this.state = {
      value: "",
      usable: this.props.usable,
      placeholder: ""
    };
  }
  componentDidMount() { }
  componentWillReceiveProps(nextProps) {
    if (nextProps.usable !== this.state.usable) {
      this.setState({ usable: nextProps.usable });
    }
    if (nextProps.placeholder !== this.state.placeholder) {
      this.setState({ placeholder: nextProps.placeholder });
    }
  }
  onChange = event => {
    this.setState({
      value: event.target.value
    });
  };
  onKeyDown = event => {
    if (event.keyCode === 13) {
      this.props.socket.emit("helloWorld", this.state.value);
      this.refs.input.value = ""
    }
  };
  render() {
    const usable = this.state.usable
    const placeholder = this.state.placeholder
    return (
      <div className={styles.input_send}>
        <input ref="input" type="text" placeholder={placeholder} onChange={this.onChange} onKeyDown={this.onKeyDown} />
        <button className={!usable && styles.noUsableButton}>&nbsp;send&nbsp;</button>
      </div>
    );
  }
}

export default InputSend;
