import { useRef } from 'react';
import styles from './styles.module.css';

export default function Header({ menuOpen, onChange, onPreview }) {
  const gesture = useRef({ count: 0, start: 0 });
  const clickLogo = () => {
    const now = performance.now();
    if (now - gesture.current.start > 3000 || !gesture.current.count) gesture.current = { count: 0, start: now };
    if (++gesture.current.count === 5) {
      gesture.current.count = 0;
      onPreview?.();
    }
  };
  return (
    <header className={styles.header}>
      <button aria-label="Menu" aria-expanded={menuOpen}
        className={[styles.menu_button, menuOpen ? styles.open : ''].join(' ')}
        onClick={() => onChange(!menuOpen)}>
        <div className={styles.menu_button_line0} />
        <div className={styles.menu_button_line1} />
        <div className={styles.menu_button_line2} />
      </button>
      <button className={styles.logo_container} aria-label="Space Radio" onClick={clickLogo}>
        <img className={styles.logo} src="logo_r.svg" alt="Space Radio" />
      </button>
    </header>
  );
}
