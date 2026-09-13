import { Player, Volume, getContext, now, start } from 'tone';
import { ReceiverNoise } from './receiver';

export const audioAdapter = {
  unlock: start,
  now,
  schedule: (callback, seconds) => getContext().setTimeout(callback, seconds),
  cancel: id => getContext().clearTimeout(id),
  createNoise: () => new ReceiverNoise(),
  createMusicBus: () => new Volume(-200).toDestination(),
  createPlayer: (onstop, bus) => new Player({ onstop }).connect(bus),
};
