import { createRoot } from 'react-dom/client';
import { useEffect, useRef, useState } from 'react';
import { Noise } from 'tone';
import { AudioController } from '../../src/audio/controller';
import { audioAdapter } from '../../src/audio/adapter';
import './audio-preview.css';

// This preview uses the production controller and graph. Only track duration is
// shortened, so several real MP3 transitions can be checked within one minute.
function Preview() {
  const engine = useRef(null);
  const [mode, setMode] = useState('');
  const [distance, setDistance] = useState(3000);
  const [tracks, setTracks] = useState(false);
  const [status, setStatus] = useState('尚未播放');
  const playlist = tracks ? ['./musicList/1.mp3', './musicList/2.mp3'] : [];
  useEffect(() => { engine.current?.update(distance, playlist); }, [distance, tracks]);
  useEffect(() => () => engine.current?.dispose(), []);

  const play = async selected => {
    engine.current?.dispose();
    const adapter = {
      ...audioAdapter,
      createNoise: selected === 'old' ? () => {
        const source = new Noise({ type: 'pink', volume: -200 }).toDestination();
        return { volume: source.volume, start: () => source.start(), dispose: () => { source.stop(); source.dispose(); } };
      } : audioAdapter.createNoise,
      createPlayer: (onstop, bus) => {
        const source = audioAdapter.createPlayer(onstop, bus);
        return {
          buffer: { duration: 12 },
          load: url => source.load(url),
          set fadeIn(value) { source.fadeIn = value; },
          set fadeOut(value) { source.fadeOut = value; },
          start: time => source.start(time, 0, 12),
          stop: time => source.stop(time),
          dispose: () => source.dispose(),
        };
      },
    };
    const next = new AudioController(adapter);
    engine.current = next;
    // Exposed only in the fixture for lifecycle and real-audio regression checks.
    window.audioPreview = next;
    next.update(distance, playlist);
    try { await next.start(); setMode(selected); setStatus('播放中'); }
    catch (error) { setStatus(error.message); }
  };
  return <main>
    <p className="eyebrow">SPACE RADIO · AUDIO LAB</p>
    <h1>无线电底噪试听</h1>
    <p>在覆盖区外对比底噪；进入覆盖区可检查音乐与噪音的过渡。每首截取 12 秒，方便连续试听。</p>
    <div className="buttons">
      <button aria-pressed={mode === 'new'} onClick={() => play('new')}>新底噪</button>
      <button aria-pressed={mode === 'old'} onClick={() => play('old')}>原粉噪音</button>
      <button onClick={() => { engine.current?.dispose(); setMode(''); setStatus('已停止'); }}>停止</button>
    </div>
    <p role="status">{status}</p>
    <label htmlFor="distance">距离：{distance} km · {distance < 2250 ? '覆盖区内' : '覆盖区外'}</label>
    <input id="distance" type="range" min="350" max="3500" step="10" value={distance} onChange={event => setDistance(Number(event.target.value))} />
    <div className="buttons presets">
      <button onClick={() => setDistance(1000)}>清晰接收</button>
      <button onClick={() => setDistance(2200)}>覆盖边缘</button>
      <button onClick={() => setDistance(3000)}>覆盖区外</button>
    </div>
    <label className="music"><input type="checkbox" checked={tracks} onChange={event => setTracks(event.target.checked)} /> 播放音乐，测试 12 秒换曲</label>
    <p className="hint">新底噪中，调频细节间隔约 4–12 秒。建议每种听 20 秒以上。此页仅供试听，正式界面保持原样。</p>
  </main>;
}
createRoot(document.getElementById('root')).render(<Preview />);
