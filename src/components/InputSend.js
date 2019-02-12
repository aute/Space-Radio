import React, { Component } from "react";

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
      <input type="text" onChange={this.onChange} onKeyDown={this.onKeyDown} style={{
        background: "none",
        outline: "none",
        border: "0"
      }}
      />
    );
  }
}

export default InputSend;
