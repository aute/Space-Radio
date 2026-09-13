import { useEffect, useState } from 'react';
import { formatCoordinates } from '../../utils';
import styles from './styles.module.css';

export default function Messages({ usable, socket }) {
  const [messages, setMessages] = useState([]);
  useEffect(() => {
    if (!usable) setMessages([]);
    const receive = data => {
      if (usable) setMessages(previous => [data, ...previous]);
    };
    socket.on('hello', receive);
    return () => socket.off('hello', receive);
  }, [socket, usable]);
  return (
    <div className={[styles.Messages, !usable ? styles.show_messages : ''].join(' ')}>
      <div className={styles.menu_button_line0} />
      <div className={styles.menu_button_line1} />
      <article className={styles.Messages_window} aria-live="polite">
        {messages.map(item => (
          <div key={item.message_key} className={styles.Message_content}>
            <address>{formatCoordinates(item.lat, item.lng)}</address>
            <p>{item.text}</p>
          </div>
        ))}
      </article>
    </div>
  );
}
