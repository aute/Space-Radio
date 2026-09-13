import styles from './styles.module.css';

export default function Sider({ menuOpen, children }) {
  return <div className={[styles.Sider, menuOpen ? styles.menuOpen : ''].join(' ')}>{children}</div>;
}
