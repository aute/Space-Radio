import styles from './styles.module.css';

export default function Header({ menuOpen, onChange }) {
  return (
    <header className={styles.header}>
      <button aria-label="Menu" aria-expanded={menuOpen}
        className={[styles.menu_button, menuOpen ? styles.open : ''].join(' ')}
        onClick={() => onChange(!menuOpen)}>
        <div className={styles.menu_button_line0} />
        <div className={styles.menu_button_line1} />
        <div className={styles.menu_button_line2} />
      </button>
      <div className={styles.logo_container}>
        <img className={styles.logo} src="logo_r.svg" alt="Space Radio" />
      </div>
    </header>
  );
}
