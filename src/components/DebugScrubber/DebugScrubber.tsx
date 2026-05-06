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

  // Sample the master cycle every frame: the longest-running animation on the
  // page is the demo loop; transient transitions (shorter durations) must not
  // hijack the cycle length or the slider position.
  useEffect(() => {
    if (!enabled || paused) return;
    const sample = () => {
      const anims = document.getAnimations();
      let maxDur = 0;
      let masterCT = 0;
      for (let i = 0; i < anims.length; i++) {
        const d = anims[i].effect?.getTiming().duration;
        if (typeof d === 'number' && d > maxDur) {
          maxDur = d;
          const ct = anims[i].currentTime;
          masterCT = typeof ct === 'number' ? ct : 0;
        }
      }
      if (maxDur > 0) {
        setCycleMs(maxDur);
        setTime(masterCT % maxDur);
      }
      rafRef.current = requestAnimationFrame(sample);
    };
    rafRef.current = requestAnimationFrame(sample);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [enabled, paused]);

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
