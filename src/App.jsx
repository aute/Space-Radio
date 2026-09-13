import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import './App.css';
import Loading from './components/Loading';
import InputSend from './components/InputSend';
import ISS from './components/ISS';
import SkyBackground from './components/SkyBackground';
import Header from './components/Header';
import Menu from './components/Menu';
import Sider from './components/Sider';
import ForecastBoard from './components/ForecastBoard';
import Messages from './components/Messages';
import { RadioStore } from './mobx/store';
import { formatCoordinates } from './utils';
import { useRadioAudio } from './audio/useRadioAudio';

const App = observer(function App({ store: suppliedStore }) {
  const [store] = useState(() => suppliedStore || new RadioStore());
  const [menuOpen, setMenuOpen] = useState(false);
  const audio = useRadioAudio(store.distance, store.audioPlaylist, store.passProgress, store.preview?.anchor ?? "live");
  useEffect(() => {
    void store.start();
    return () => store.stop();
  }, [store]);
  return (
    <div className="App">
      <SkyBackground location={store.location} timestamp={store.time || undefined} />
      <Loading hidden={audio.started} ok={store.ready} error={store.error || audio.error}
        onRetry={store.ready ? audio.start : store.retry} onClick={audio.start} />
      <ISS key={`${store.preview?.anchor ?? "live"}-${store.visualPass?.risetime ?? "idle"}`}
        iss_passing={Boolean(store.visualPass)} oldDuration={((store.visualPass?.duration || 0) + 10) * 1000}
        elapsed={store.visualPass ? store.time - (store.visualPass.risetime * 1000 - 10000) : 0} />
      <div />
      <Header menuOpen={menuOpen} onChange={setMenuOpen} onPreview={() => { void audio.start(); void store.startPreview(); }} />
      {menuOpen && <Menu />}
      <Sider menuOpen={menuOpen}>
        <ForecastBoard distance={store.distance ?? 0} nextPass={store.nextPass} />
        <footer>
          <Messages key={store.preview?.anchor ?? "live"} usable={store.passing} socket={store.messageSocket} />
          <InputSend usable={store.passing} socket={store.messageSocket} nextPass={store.nextPass}
            placeholder={formatCoordinates(store.location?.lat, store.location?.lng)} />
        </footer>
      </Sider>
    </div>
  );
});
export default App;
