import { useEffect, useState, useCallback } from 'react';
import { audioAdapter } from './adapter';
import { AudioController } from './controller';

export function useRadioAudio(distance, playlist, passProgress, playbackSession) {
  const [engine] = useState(() => new AudioController(audioAdapter));
  const [started, setStarted] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { engine.update(distance, playlist, passProgress, playbackSession); }, [engine, distance, playlist, passProgress, playbackSession]);
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
