import React, { Component } from "react";
import moment from "moment";
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
        <h4>ISS is far away</h4>
        <h1 className="ForecastTitle">{this.props.distance} KM</h1>
        <h2 className="ForecastSubTitle">
          Next pass times <span className="arrow">➡️</span>{" "}
          {moment(new Date(this.props.risetime)).format("hh:mm A")}
        </h2>
        {this.props.passList.map((item, index) => {
          return index > 0 ? (
            <h3 className="ForecastSubTitles" key={index}>
              {moment(new Date(item.risetime * 1000)).format("hh:mm A")}
            </h3>
          ) : (
            ""
          );
        })}
      </div>
    );
  }
}

export default ForecastBoard;
