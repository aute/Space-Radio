import React, { Component } from "react";
import styles from "./styles.module.css";

class Messages extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showMessages: true
    };
  }
  componentDidMount() {}
  render() {
    const showMessages = this.state.showMessages;
    return (
      <div
        className={[
          `${styles.Messages}`,
          `${showMessages ? styles.show_messages : null}`
        ].join(" ")}
        onClick={() => {
          this.setState({
            showMessages: !this.state.showMessages
          })
        }}
      >
        <div className={styles.menu_button_line0} />
        <div className={styles.menu_button_line1} />
      </div>
    );
  }
}

export default Messages;
