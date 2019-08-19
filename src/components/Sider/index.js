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
  componentWillReceiveProps(nextProps) {
    if (nextProps.menuOpen !== this.state.menuOpen) {
      this.setState({ menuOpen: nextProps.menuOpen });
    }
  }
  render() {
    const menuOpen = this.state.menuOpen;
    return (
      <div className={[
        styles.Sider,
        menuOpen ? styles.menuOpen:''].join(" ")}>
        {this.props.children}
      </div>
    );
  }
}

export default Sider;
