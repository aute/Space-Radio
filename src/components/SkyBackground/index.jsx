import { useEffect, useState } from 'react';
import './SkyBackground.css';

function skyHour() {
  const now = new Date();
  return now.getMinutes() > 10 ? now.getHours() + 1 : now.getHours();
}
export default function SkyBackground() {
  const [hour, setHour] = useState(skyHour);
  useEffect(() => {
    const timer = setInterval(() => setHour(skyHour()), 3600000);
    return () => clearInterval(timer);
  }, []);
  return <div className={`sky-gradient-${hour}`} />;
}
