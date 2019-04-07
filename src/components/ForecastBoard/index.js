import React, { Component } from "react";
import moment from "moment";
import styles from "./ForecastBoard.module.css";
import Odometer from "odometer";
import "odometer/themes/odometer-theme-default.css";

class ForecastBoard extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.distance = React.createRef();
    this.od = null;
  }
  componentDidMount() {
    this.od = new Odometer({
      el: this.distance.current,
      value: "0",
      duration: 3000,
      format: "(,ddd)"
    });
  }
  componentWillReceiveProps(nextProps) {
    this.od.update(nextProps.distance);
  }
  render() {
    return (
      <div className={styles.ForecastBoard}>
        <h1 className={styles.ForecastTitle}>
          <span ref={this.distance} />
          <span className={styles.company}>&nbsp;KM</span>
        </h1>
        <div className={styles.ForecastSubTitle}>
          <h5>NEXT &nbsp;ISS &nbsp;PASS</h5>
          <h3>
            {moment(
              new Date(
                this.props.risetimObsolete
                  ? this.props.risetime[1]
                  : this.props.risetime[0]
              )
            ).format("A hh:mm:ss")}
          </h3>
        </div>
      </div>
    );
  }
}

export default ForecastBoard;
