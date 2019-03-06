import React, { Component } from "react";
import { LatLonSpherical } from "geodesy";
import styles from "./styles.module.css";

class Messages extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showMessages: props.usable,
      messages:[]
    };
  }
  componentDidMount() {
        //接收广播信息
    this.props.socket.on("hello", data => {
          this.setState({
            messages: [ data,...this.state.messages]
          });
        });
  }
  componentWillReceiveProps(nextProps) {
    this.setState({ showMessages: nextProps.usable });
    if (!nextProps.usable) {
      this.setState({
        messages: []
      });
    }
  }
  renderMessagesList = () => {
    return this.state.messages.map((item, index) => {
      return (
        <div key={item.message_key} className={styles.Message_content}>
          <address>{LatLonSpherical(item.lat,item.lng).toString()}</address>
          <p>{item.text}</p>
        </div>
      );
    });
  };
  render() {
    const showMessages = !this.state.showMessages;
    return (
      <div
        className={[
          `${styles.Messages}`,
          `${showMessages ? styles.show_messages : null}`
        ].join(" ")}
      >
        <div className={styles.menu_button_line0} />
        <div className={styles.menu_button_line1} />
        <article className={styles.Messages_window}>
          {this.renderMessagesList()}
        </article> 
      </div>
    );
  }
}

export default Messages;
