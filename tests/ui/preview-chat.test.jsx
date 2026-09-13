import { it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RadioStore } from '../../src/mobx/store';
import Messages from '../../src/components/Messages';
import InputSend from '../../src/components/InputSend';

it('rehearses sending and receiving locally, then returns to the real socket', () => {
  const live = { emit: vi.fn() };
  const store = new RadioStore({ socket: live });
  store.location = { lat: 0, lng: 0 };
  store.preview = { time: 1000000, anchor: 0 };
  store.time = 1000000;
  store.passes = [{ risetime: 990, duration: 30 }];
  const socket = store.messageSocket;
  const view = render(<><Messages usable={store.passing} socket={socket} /><InputSend usable={store.passing} socket={socket} /></>);
  fireEvent.change(screen.getByRole('textbox'), { target: { value: '模拟过境测试' } });
  fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
  expect(screen.getByText('模拟过境测试')).toBeInTheDocument();
  expect(screen.getByRole('textbox')).toHaveValue('');
  expect(live.emit).not.toHaveBeenCalled();
  store.time = 1030000;
  socket.emit('helloWorld', 'outside pass');
  expect(screen.queryByText('outside pass')).toBeNull();
  view.unmount();
  store.restoreLive();
  expect(store.messageSocket).toBe(live);
});
