import { useState } from 'react';
import styles from './styles.module.css';
import Writings from '../Writings';

export default function Menu() {
  const [showWritings, setShowWritings] = useState(false);
  return (
    <div>
      {showWritings ? <Writings onBack={() => setShowWritings(false)} /> : (
        <ul className={styles.menu}>
          {['Programme', 'Story & Team', 'ISS Info', 'Copyright'].map(label => (
            <li key={label} role="button" tabIndex={0} onClick={() => setShowWritings(true)}
              onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') setShowWritings(true); }}>{label}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
