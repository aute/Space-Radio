import React from 'react';
import { it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import InputSend from '../../src/components/InputSend';
import Header from '../../src/components/Header';
import Menu from '../../src/components/Menu';
import Messages from '../../src/components/Messages';
import { formatCoordinates, formatTime } from '../../src/utils';

it('preserves coordinate formatting and local AM/PM time', () => {
  expect(formatCoordinates(31.167212, 121.453559)).toBe('31°10′02″N, 121°27′13″E');
  expect(formatCoordinates(0, 0)).toBe('00°00′00″N, 000°00′00″E');
  expect(formatTime(new Date(2026, 0, 1, 13, 2, 3).getTime())).toBe('PM 01:02:03');
});

it('sends once on Enter and clears the controlled input', () => {
  const socket = { emit: vi.fn() };
  const view = render(<InputSend usable socket={socket} placeholder="coordinates" />);
  const input = screen.getByRole('textbox');
  fireEvent.change(input, { target: { value: 'hello orbit' } });
  fireEvent.keyDown(input, { key: 'Enter', isComposing: true });
  expect(socket.emit).not.toHaveBeenCalled();
  fireEvent.keyDown(input, { key: 'Enter' });
  expect(socket.emit).toHaveBeenCalledWith('helloWorld', 'hello orbit');
  expect(input).toHaveValue('');
  fireEvent.keyDown(input, { key: 'Enter' });
  expect(socket.emit).toHaveBeenCalledTimes(1);
  view.rerender(<InputSend usable={false} socket={socket} />);
  fireEvent.change(input, { target: { value: 'out of range' } });
  fireEvent.click(screen.getByRole('button'));
  expect(socket.emit).toHaveBeenCalledTimes(1);
});

it('keeps the menu labels, existing story content and back action', () => {
  const onChange = vi.fn();
  render(<><Header menuOpen={false} onChange={onChange} /><Menu /></>);
  fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
  expect(onChange).toHaveBeenCalledWith(true);
  fireEvent.click(screen.getByText('Story & Team'));
  expect(screen.getByText('故事')).toBeInTheDocument();
  fireEvent.click(screen.getByText('<-'));
  expect(screen.getByText('Programme')).toBeInTheDocument();
});

it('shows newest messages first and removes listeners on unmount', () => {
  let receive;
  const socket = { on: vi.fn((name, handler) => { receive = handler; }), off: vi.fn() };
  const view = render(<Messages usable socket={socket} />);
  act(() => {
    receive({ message_key: 'a', lat: 0, lng: 0, text: 'older' });
    receive({ message_key: 'b', lat: 0, lng: 0, text: 'newer' });
  });
  expect([...view.container.querySelectorAll('p')].map(p => p.textContent)).toEqual(['newer', 'older']);
  view.rerender(<Messages usable={false} socket={socket} />);
  expect(screen.queryByText('newer')).toBeNull();
  view.unmount();
  expect(socket.off).toHaveBeenCalledWith('hello', expect.any(Function));
});

it('requires five logo clicks within a short window and resets the gesture', () => {
  vi.useFakeTimers();
  try {
    const onPreview = vi.fn();
    render(<Header menuOpen={false} onChange={() => {}} onPreview={onPreview} />);
    const logo = screen.getByRole('button', { name: 'Space Radio' });
    for (let i = 0; i < 4; i++) fireEvent.click(logo);
    expect(onPreview).not.toHaveBeenCalled();
    vi.advanceTimersByTime(3100);
    fireEvent.click(logo);
    expect(onPreview).not.toHaveBeenCalled();
    for (let i = 0; i < 4; i++) fireEvent.click(logo);
    expect(onPreview).toHaveBeenCalledOnce();
    fireEvent.click(logo);
    expect(onPreview).toHaveBeenCalledOnce();
  } finally { vi.useRealTimers(); }
});

it('shows the next pass on a blocked send, preserves the draft and restarts auto-dismiss', () => {
  vi.useFakeTimers();
  try {
    const socket = { emit: vi.fn() };
    const pass = { risetime: new Date(2026, 8, 14, 16, 11, 11).getTime() / 1000 };
    const view = render(<InputSend usable={false} socket={socket} nextPass={pass} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'draft' } });
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('status')).toHaveTextContent('当前无法发送');
    expect(screen.getByRole('status')).toHaveTextContent('16:11:11');
    expect(screen.getByRole('textbox')).toHaveValue('draft');
    expect(socket.emit).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(3000));
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
    act(() => vi.advanceTimersByTime(1500));
    expect(screen.getByRole('status')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(2500));
    expect(screen.queryByRole('status')).toBeNull();
    view.unmount();
    expect(vi.getTimerCount()).toBe(0);
  } finally { vi.useRealTimers(); }
});

it('handles missing forecasts and clears the notice as reception becomes available', () => {
  const socket = { emit: vi.fn() };
  const view = render(<InputSend usable={false} socket={socket} />);
  fireEvent.click(screen.getByRole('button'));
  expect(screen.getByRole('status')).toHaveTextContent('下一次过境时间暂不可用');
  view.rerender(<InputSend usable socket={socket} />);
  expect(screen.queryByRole('status')).toBeNull();
});
