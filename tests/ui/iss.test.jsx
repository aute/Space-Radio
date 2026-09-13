import { it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import ISS from '../../src/components/ISS';

it('uses a single constant-speed path from the screen edge, preserves elapsed progress and cancels motion on unmount', () => {
  const animation = { cancel: vi.fn(), currentTime: 0 };
  const animate = vi.fn(() => animation);
  const original = Element.prototype.animate;
  Element.prototype.animate = animate;
  try {
    const view = render(<ISS iss_passing oldDuration={70000} elapsed={20000} />);
    const [frames, options] = animate.mock.calls[0];
    expect(frames).toHaveLength(2);
    expect(frames[0].transform).toContain('100vh + 12px');
    expect(frames.map(frame => frame.offset)).toEqual([0, 1]);
    expect(frames.every(frame => !frame.easing || frame.easing === 'linear')).toBe(true);
    expect(options).toMatchObject({ duration: 70000, delay: -20000, easing: 'linear' });
    view.rerender(<ISS iss_passing oldDuration={70000} elapsed={21000} />);
    expect(animate).toHaveBeenCalledOnce();
    view.unmount();
    expect(animation.cancel).toHaveBeenCalledOnce();
  } finally { Element.prototype.animate = original; }
});
