import React, { Component } from "react";
import styles from "./styles.module.css";

class Header extends Component {
  constructor(props) {
    super(props);
    this.state = {
      menuOpen: false
    };
  }
  componentDidMount() { }
  menuButtonSwitch = event => {
    this.setState({
      menuOpen: !this.state.menuOpen
    })
  };
  render() {
    const menuOpen = this.state.menuOpen;
    return (
      <header className={styles.header}>
        <button
          className={[
            `${styles.menu_button}`,
            `${menuOpen ? styles.open : null}`
          ].join(" ")}
          onClick={this.menuButtonSwitch}
        >
          <div className={styles.menu_button_line0} />
          <div className={styles.menu_button_line1} />
          <div className={styles.menu_button_line2} />
        </button>
        <div className={styles.logo_container}>
          <img className={styles.logo} src="logo_r.svg" alt=""/>
        </div>
      </header>
    );
  }
}

export default Header;
