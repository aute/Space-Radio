import React, { Component } from "react";
import styles from "./styles.module.css";

class Sider extends Component {
  constructor(props) {
    super(props);
    this.state = {
      menuOpen: false
    };
  }
  componentDidMount() { }
  render() {
    const menuOpen = this.state.menuOpen;
    return (
      <div className={styles.Sider}>
        {this.props.children}
      </div>
    );
  }
}

export default Sider;
