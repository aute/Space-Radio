import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import SkyBackground from '../../src/components/SkyBackground';
import { skyForTime } from '../../src/components/SkyBackground/sky';
import './sky-preview.css';

const location = { lat: 31.17, lng: 121.45 };
const checkpoints = [['深夜', 0], ['晨光', 5], ['日出前后', 5.7], ['清晨', 7], ['正午', 12], ['傍晚', 17.5], ['暮光', 18.2], ['入夜', 20]];
const clock = hour => {
  const minutes = Math.floor(hour * 60 + 1e-6);
  return `${String(Math.floor(minutes / 60) % 24).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
};

function Preview() {
  const [hour, setHour] = useState(5.7);
  const [playing, setPlaying] = useState(false);
  const [date, setDate] = useState('2026-09-14');
  const start = Date.parse(`${date}T00:00:00+08:00`);
  const timestamp = start + hour * 3600000;
  useEffect(() => {
    if (!playing) return;
    let frame;
    let previous = performance.now();
    const update = time => {
      // Two minutes per full day, driven by elapsed time rather than frame count.
      setHour(value => (value + (time - previous) / 5000) % 24);
      previous = time;
      frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [playing]);
  return <main>
    <header><div><h1>纯净晴空</h1><p>上海 · 连续太阳高度 · 无星点、云层或天体</p></div>
      <label>日期 <input type="date" value={date} onChange={event => { if (event.target.value) setDate(event.target.value); }} /></label></header>
    <section className="sky-scene hero" aria-label="天空预览">
      <SkyBackground timestamp={timestamp} location={location} transitionSeconds={0} />
      <div className="sky-caption"><strong>{clock(hour)}</strong><span>太阳高度 {skyForTime(timestamp, location).elevation.toFixed(1)}°</span></div>
    </section>
    <div className="sky-controls"><button onClick={() => setPlaying(value => !value)}>{playing ? '暂停' : '播放一天'}</button>
      <input aria-label="一天中的时间" type="range" min="0" max="23.999" step="0.001" value={hour}
        onChange={event => { setPlaying(false); setHour(Number(event.target.value)); }} /><span>{clock(hour)}</span></div>
    <section className="sky-swatches" aria-label="一天的天空对比">
      {checkpoints.map(([label, time]) => <button className="sky-scene swatch" key={label}
        onClick={() => { setPlaying(false); setHour(time); }} aria-label={`${label} ${clock(time)}`}>
        <SkyBackground timestamp={start + time * 3600000} location={location} transitionSeconds={0} />
        <span>{label}<small>{clock(time)}</small></span>
      </button>)}
    </section>
    <p className="sky-note">拖动滑块检查任意时刻；播放时用两分钟走完一天。正式电台按真实时间变化，不显示这些控件。</p>
  </main>;
}
createRoot(document.getElementById('root')).render(<Preview />);
