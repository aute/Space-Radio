import React, { Component } from "react";
import moment from "moment";
import styles from "./ForecastBoard.module.css";

class ForecastBoard extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }
  componentDidMount() {}
  render() {
    return (
      <div className={styles.ForecastBoard}>
        <h1 className={styles.ForecastTitle}>
          <span>{this.props.distance}</span>
          <span className={styles.company}>&nbsp;KM</span>
        </h1>
        <div className={styles.ForecastSubTitle}>
          <h5>NEXT &nbsp;ISS &nbsp;PASS</h5>
          <h3>
            {moment(new Date(this.props.risetime)).format("hh:mm:ss A")} ∇
          </h3>
        </div>
      </div>
    );
  }
}

export default ForecastBoard;
