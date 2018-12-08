import React, { Component } from "react";
import moment from "moment"
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
        <h1 className="ForecastTitle">{this.props.distance}<br/>KM</h1>
        <h2 className="ForecastSubTitle">NEXT &nbsp;ISS &nbsp;PASS<br/> &nbsp;{moment(new Date(this.props.risetime)).format('hh:mm:ss A')} ∇</h2>
      </div>
    );
  }
}

export default ForecastBoard;
