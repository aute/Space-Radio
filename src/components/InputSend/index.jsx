import { useEffect, useRef, useState } from 'react';
import styles from './styles.module.css';

export default function InputSend({ usable, placeholder, socket, nextPass }) {
  const [value, setValue] = useState('');
  const [notice, setNotice] = useState(false);
  const dismissTimer = useRef(null);
  useEffect(() => () => clearTimeout(dismissTimer.current), []);
  useEffect(() => {
    if (usable) { clearTimeout(dismissTimer.current); setNotice(false); }
  }, [usable]);
  const nextArrival = Number.isFinite(nextPass?.risetime)
    ? new Date(nextPass.risetime * 1000).toLocaleString('zh-CN', {
      month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    }) : null;
  function sendMessage() {
    if (!usable) {
      // Keep the draft and extend the same notice instead of stacking popups.
      clearTimeout(dismissTimer.current);
      setNotice(true);
      dismissTimer.current = setTimeout(() => setNotice(false), 4000);
      return;
    }
    if (!value.trim()) return;
    socket.emit('helloWorld', value);
    setValue('');
  }
  return (
    <div className={styles.input_send}>
      {notice && <div className={styles.send_notice} role="status" aria-live="polite">
        当前无法发送 · {nextArrival ? `下次 ISS 经过：${nextArrival}` : '下一次过境时间暂不可用'}
      </div>}
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
