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
          <span className="state-blok">
            <div id="spinner" className={`${this.props.ok ? "hidden" : ""}`}> 
            Initializing<span id="flash"> _</span>
            </div>
            <button
              id="go"
              className={`${this.props.ok ? "show" : ""}`}
              onClick={e => this.props.onClick(e)}
              onTouchEnd={e => this.props.onTouchEnd(e)}
            >
              Press to enter : )
            </button>
          </span>
        </div>
      </div>
    );
  }
}

export default Loading;
