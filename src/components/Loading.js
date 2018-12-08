import React, { Component } from "react";
import "./Loading.css";

class Loading extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }
  componentDidMount() {}
  render() {
    return (
      <div
        className={["loading", `${this.props.hidden ? "hidden" : ""}`].join(
          " "
        )}
        onTouchEnd={e => this.props.onTouchEnd(e)}
        onDoubleClick={e => this.props.onDoubleClick(e)}
      >
        <div className="loading-container">
          <img className="main-logo" src="./logo.svg" alt="" />
        </div>
      </div>
    );
  }
}

export default Loading;
