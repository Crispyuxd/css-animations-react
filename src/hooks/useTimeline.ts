'use client';

import { useEffect, useRef } from 'react';
import { generateTimelineCSS } from '@/lib/timeline-engine';
import type { TimelineConfig } from '@/lib/types';

export function useTimeline(config: TimelineConfig): void {
  const styleRef = useRef<HTMLStyleElement | null>(null);

  useEffect(() => {
    const css = generateTimelineCSS(config);
    const style = document.createElement('style');
    style.id = 'generated-timeline';
    style.textContent = css;
    document.head.appendChild(style);
    styleRef.current = style;

    return () => {
      style.remove();
    };
  }, [config]);
}
