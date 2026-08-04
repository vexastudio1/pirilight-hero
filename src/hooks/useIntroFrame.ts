import { useEffect, useRef } from 'react';
import { introState } from '../lib/introState';

// Runs `onFrame` every animation frame with the shared sequence clock
// (introState.elapsed, written by PiriModel) and the current resetSignal, so
// DOM overlays stay perfectly in sync with the 3D flight without keeping a
// second clock and without triggering any React re-renders themselves.
export function useIntroFrame(onFrame: (elapsed: number, resetSignal: number) => void) {
  const callback = useRef(onFrame);
  callback.current = onFrame;

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      callback.current(introState.elapsed, introState.resetSignal);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
}
