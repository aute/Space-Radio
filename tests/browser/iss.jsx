import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import ISS from '../../src/components/ISS';
import SkyBackground from '../../src/components/SkyBackground';
import '../../src/index.css';

// Accelerated visual fixture; production continues to use the actual pass duration.
function Preview() {
  const [pass, setPass] = useState(0);
  const [hour, setHour] = useState('20');
  return <>
    <SkyBackground timestamp={Date.parse('2026-09-14T00:00:00+08:00') + Number(hour) * 3600000} location={{ lat: 31.17, lng: 121.45 }} />
    <ISS key={pass} iss_passing oldDuration={30000} />
    <aside style={{ position: 'fixed', bottom: 30, left: 30, zIndex: 3, color: '#eee', font: '14px system-ui', background: '#132231bb', padding: 18, borderRadius: 10 }}>
      <p>ISS 光点 · 30 秒过境预览</p>
      <label>天空 <select value={hour} onChange={event => setHour(event.target.value)} aria-label="天空时段">
        <option value="20">夜晚</option><option value="5.7">晨光</option><option value="12">白天</option>
      </select></label>{' '}
      <button onClick={() => setPass(value => value + 1)}>重新划过</button>
    </aside>
  </>;
}
createRoot(document.getElementById('root')).render(<Preview />);
