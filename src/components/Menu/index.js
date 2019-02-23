import React, { Component } from "react";
import styles from "./styles.module.css";

class Menu extends Component {
  constructor(props) {
    super(props);
    this.state = {
      menuOpen: this.menuOpen
    };
  }
  componentDidMount() { }

  render() {
    return (
      <ul className={styles.menu}>
        <li>Programme</li>
        <li>Story & Team</li>
        <li>ISS Info</li>
        <li>Copyright</li>
      </ul>
    );
  }
}

export default Menu;
