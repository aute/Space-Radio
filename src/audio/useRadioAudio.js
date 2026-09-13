import { useEffect, useState, useCallback } from 'react';
import { Noise, Player, start } from 'tone';
import { AudioController } from './controller';

const adapter = {
  unlock: start,
  createNoise: () => new Noise('pink').toDestination(),
  createPlayer: onstop => new Player({ onstop }).toDestination(),
};

export function useRadioAudio(distance, playlist) {
  const [engine] = useState(() => new AudioController(adapter));
  const [started, setStarted] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { engine.update(distance, playlist); }, [engine, distance, playlist]);
  useEffect(() => () => engine.dispose(), [engine]);
  const begin = useCallback(async () => {
    try {
      await engine.start();
      if (!engine.disposed) { setStarted(true); setError(''); }
    } catch {
      if (!engine.disposed) setError('Audio could not start. Please retry.');
    }
  }, [engine]);
  return { started, error, start: begin };
}
