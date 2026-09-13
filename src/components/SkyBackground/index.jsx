import { useEffect, useState } from 'react';
import { skyStyle } from './sky';
import './SkyBackground.css';

export default function SkyBackground({ location, timestamp, transitionSeconds = 1 }) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    // The app and previews can supply a shared page clock.
    if (timestamp !== undefined) return;
    let timer;
    const resume = () => {
      clearInterval(timer);
      if (document.hidden) return;
      setNow(Date.now());
      timer = setInterval(() => setNow(Date.now()), 1000);
    };
    resume();
    document.addEventListener('visibilitychange', resume);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', resume);
    };
  }, [timestamp]);
  return <div className="sky-background" aria-hidden="true"
    style={{ ...skyStyle(timestamp ?? now, location), '--sky-transition': `${transitionSeconds}s` }} />;
}
