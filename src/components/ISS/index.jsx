import { useEffect, useRef } from 'react';
import styles from './styles.module.css';

function ISS({ iss_passing, oldDuration, elapsed = 0 }) {
  const marker = useRef(null);
  const initialElapsed = useRef(elapsed);
  useEffect(() => {
    if (!iss_passing || !marker.current) return;
    let animation;
    const animate = () => {
      const currentTime = animation?.currentTime ?? 0;
      animation?.cancel();
      // A single linear path keeps ingress and the visible pass at the same speed.
      // Start just outside the edge so the halo appears naturally without a long wait.
      const frames = [
        { transform: 'translate3d(50vw, calc(100vh + 12px), 0)', offset: 0 },
        { transform: 'translate3d(30vw, -48px, 0)', offset: 1 },
      ];
      animation = marker.current.animate(frames, {
        duration: oldDuration, delay: -initialElapsed.current, fill: 'both', easing: 'linear',
      });
      animation.currentTime = currentTime;
    };
    animate();
    window.addEventListener('resize', animate);
    return () => { window.removeEventListener('resize', animate); animation.cancel(); };
  }, [iss_passing, oldDuration]);
  if (!iss_passing) return null;
  return (
    <div ref={marker} className={styles.circleContainer} aria-label="ISS" role="img">
      <span className={styles.label} aria-hidden="true">ISS</span>
      {/* Keep the trailing light outside the rotating identification ring. */}
      <span className={styles.trail} aria-hidden="true" />
      <span className={styles.halo} aria-hidden="true" />
      <span className={styles.focus} aria-hidden="true" />
      <span className={styles.core} aria-hidden="true" />
    </div>
  );
}

export default ISS;
