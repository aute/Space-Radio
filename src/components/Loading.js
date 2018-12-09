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
      >
        <div className="loading-container">
          <img className="main-logo" src="./logo.svg" alt="" />
          <span className="separate" />
          <span className="state-blok">
            <div id="spinner" className={`${this.props.ok ? "hidden" : ""}`}/>
            <button
              id="go"
              className={`${this.props.ok ? "show" : ""}`}
              onClick={e => this.props.onDoubleClick(e)}
              onTouchEnd={e => this.props.onTouchEnd(e)}
            >
              →
            </button>
          </span>
        </div>
      </div>
    );
  }
}

export default Loading;
