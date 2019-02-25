import React, { Component } from "react";
import styles from "./styles.module.css";
import Writings from "../Writings";

class Menu extends Component {
  constructor(props) {
    super(props);
    this.state = {
      // menuOpen: this.menuOpen,
      WritingsShow: false
    };
  }
  componentDidMount() {}
  openWritings = () => {
    this.setState({
      WritingsShow: true
    });
  };
  onBack= () => {
    this.setState({
      WritingsShow: false
    });
  };
  render() {
    const WritingsShow = this.state.WritingsShow;
    return (
      <div>
        {WritingsShow ? (
          <Writings onBack={this.onBack}/>
        ) : (
          <ul className={styles.menu}>
            <li onClick={this.openWritings}>Programme</li>
            <li onClick={this.openWritings}>Story & Team</li>
            <li onClick={this.openWritings}>ISS Info</li>
            <li onClick={this.openWritings}>Copyright</li>
          </ul>
        )}
      </div>
    );
  }
}

export default Menu;
