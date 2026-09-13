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
  const audio = useRadioAudio(store.distance, store.playlist);
  useEffect(() => {
    void store.start();
    return () => store.stop();
  }, [store]);
  return (
    <div className="App">
      <SkyBackground />
      <Loading hidden={audio.started} ok={store.ready} error={store.error || audio.error}
        onRetry={store.ready ? audio.start : store.retry} onClick={audio.start} />
      <ISS iss_passing={store.passing} oldDuration={(store.activePass?.duration || 0) * 1000} />
      <div />
      <Header menuOpen={menuOpen} onChange={setMenuOpen} />
      {menuOpen && <Menu />}
      <Sider menuOpen={menuOpen}>
        <ForecastBoard distance={store.distance ?? 0} nextPass={store.nextPass} />
        <footer>
          <Messages usable={store.passing} socket={store.socket} />
          <InputSend usable={store.passing} socket={store.socket}
            placeholder={formatCoordinates(store.location?.lat, store.location?.lng)} />
        </footer>
      </Sider>
    </div>
  );
});
export default App;
