import { useState } from 'react';
import styles from './styles.module.css';

export default function InputSend({ usable, placeholder, socket }) {
  const [value, setValue] = useState('');
  function sendMessage() {
    if (!usable || !value.trim()) return;
    socket.emit('helloWorld', value);
    setValue('');
  }
  return (
    <div className={styles.input_send}>
      <input type="text" aria-label="Message" placeholder={placeholder} maxLength={2000}
        value={value} onChange={event => setValue(event.target.value)}
        onKeyDown={event => {
          // Enter during IME composition must not send unfinished text.
          if (event.key === 'Enter' && !event.nativeEvent.isComposing) sendMessage();
        }} />
      <button onClick={sendMessage} aria-disabled={!usable} className={usable ? '' : styles.noUsableButton}>
        &nbsp;send&nbsp;
      </button>
    </div>
  );
}
