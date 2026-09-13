import { useEffect, useRef } from 'react';
import Odometer from 'odometer';
import 'odometer/themes/odometer-theme-default.css';
import styles from './ForecastBoard.module.css';
import { formatTime } from '../../utils';

export default function ForecastBoard({ distance, nextPass }) {
  const element = useRef(null);
  const odometer = useRef(null);
  useEffect(() => {
    // Isolate the original number animation; React owns only its host element.
    odometer.current = new Odometer({ el: element.current, value: 0, duration: 3000, format: '(,ddd)' });
    return () => { odometer.current?.stopWatchingMutations(); odometer.current = null; };
  }, []);
  useEffect(() => { odometer.current?.update(distance.toFixed(2)); }, [distance]);
  return (
    <div className={styles.ForecastBoard}>
      <h1 className={styles.ForecastTitle}>
        <span ref={element} /><span className={styles.company}>&nbsp;KM</span>
      </h1>
      <div className={styles.ForecastSubTitle}>
        <h5>NEXT &nbsp;ISS &nbsp;PASS</h5>
        <h3>{formatTime(nextPass ? nextPass.risetime * 1000 : undefined)}</h3>
      </div>
    </div>
  );
}
