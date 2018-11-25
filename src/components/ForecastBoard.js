import React, { Component } from "react";
import "./ForecastBoard.css";

class ForecastBoard extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }
  componentDidMount() {}
  render() {
    return (
      <div className="ForecastBoard">
        <h1 className="ForecastTitle">{this.props.distance} KM</h1>
      </div>
    );
  }
}

export default ForecastBoard;
