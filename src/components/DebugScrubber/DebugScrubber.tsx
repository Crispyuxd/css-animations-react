'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './DebugScrubber.module.css';

// Visual timeline scrubber — always rendered to satisfy WCAG 2.2.2
// (pause/stop/hide for moving content >5s). Append `?debug` to the URL for
// the full scrubber + slider; otherwise only a compact play/pause shows.
// Uses the Web Animations API to pause / seek every running CSS animation.
export function DebugScrubber() {
  const [debug, setDebug] = useState(false);
  const [paused, setPaused] = useState(false);
  const [time, setTime] = useState(0);
  const [cycleMs, setCycleMs] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setDebug(new URLSearchParams(window.location.search).has('debug'));
  }, []);
  // Always enabled — WCAG 2.2.2 needs pause/stop on every demo, not just ?debug.
  const enabled = true;

  // Detect the cycle length once animations are running
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const tryDetect = () => {
      const anims = document.getAnimations();
      const dur = anims.find((a) => typeof a.effect?.getTiming().duration === 'number')
        ?.effect?.getTiming().duration as number | undefined;
      if (typeof dur === 'number' && dur > 0) {
        if (!cancelled) setCycleMs(dur);
        return;
      }
      if (!cancelled) requestAnimationFrame(tryDetect);
    };
    tryDetect();
    return () => { cancelled = true; };
  }, [enabled]);

  // Track time while playing
  useEffect(() => {
    if (!enabled || paused || cycleMs === 0) return;
    const tick = () => {
      const anims = document.getAnimations();
      if (anims.length > 0) {
        const ct = anims[0].currentTime;
        if (typeof ct === 'number') setTime(ct);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [enabled, paused, cycleMs]);

  if (!enabled) return null;

  const togglePause = () => {
    const anims = document.getAnimations();
    if (paused) anims.forEach((a) => a.play());
    else anims.forEach((a) => a.pause());
    setPaused(!paused);
  };

  const seek = (ms: number) => {
    document.getAnimations().forEach((a) => { a.currentTime = ms; });
    setTime(ms);
  };

  return (
    <div className={`${styles.bar} ${debug ? styles.barDebug : styles.barCompact}`}>
      <button onClick={togglePause} className={styles.btn} type="button" aria-label={paused ? 'Play' : 'Pause'}>
        {paused ? '▶' : '⏸'}
      </button>
      {debug && (
        <>
          <input
            type="range"
            min={0}
            max={cycleMs || 0}
            step={10}
            value={time}
            onChange={(e) => seek(Number(e.target.value))}
            onMouseDown={() => {
              if (!paused) {
                document.getAnimations().forEach((a) => a.pause());
                setPaused(true);
              }
            }}
            className={styles.slider}
            disabled={cycleMs === 0}
          />
          <span className={styles.time}>
            <span className={styles.label}>t </span>
            {(time / 1000).toFixed(2)}s / {(cycleMs / 1000).toFixed(0)}s
          </span>
        </>
      )}
    </div>
  );
}
