'use client';

import { useEffect, useRef } from 'react';
import { generateTimelineCSS } from '@/lib/timeline-engine';
import type { TimelineConfig } from '@/lib/types';

// Cursor SVG hotspot (the index-finger tip of the pointing hand) is roughly
// (7, 1) inside the 20x20 cursor div. Subtract this when targeting an element
// so the click point lands on the element center.
const CURSOR_HOTSPOT_X = 7;
const CURSOR_HOTSPOT_Y = 1;

export function useTimeline(config: TimelineConfig): void {
  const styleRef = useRef<HTMLStyleElement | null>(null);

  useEffect(() => {
    // Defer one frame so the DOM is laid out before we measure target elements
    const raf = requestAnimationFrame(() => {
      const resolved = resolveCursorTargets(config);
      const css = generateTimelineCSS(resolved);
      const style = document.createElement('style');
      style.id = 'generated-timeline';
      style.textContent = css;
      document.head.appendChild(style);
      styleRef.current = style;
    });

    return () => {
      cancelAnimationFrame(raf);
      if (styleRef.current) {
        styleRef.current.remove();
        styleRef.current = null;
      }
    };
  }, [config]);
}

function offsetRelativeTo(el: HTMLElement, ancestor: HTMLElement): { x: number; y: number } | null {
  let x = 0;
  let y = 0;
  let current: HTMLElement | null = el;
  while (current && current !== ancestor) {
    x += current.offsetLeft;
    y += current.offsetTop;
    current = current.offsetParent as HTMLElement | null;
  }
  if (current !== ancestor) return null;
  return { x, y };
}

function resolveCursorTargets(config: TimelineConfig): TimelineConfig {
  if (typeof document === 'undefined') return config;

  return {
    ...config,
    steps: config.steps.map((step) => {
      // Bot in word mode: count [data-word] elements once at mount so the
      // engine can emit one fade keyframe per word.
      if (step.type === 'bot' && step.mode === 'words') {
        const el = document.getElementById(step.id);
        const wordCount = el ? el.querySelectorAll('[data-word]').length : 0;
        return { ...step, wordCount };
      }

      if (step.type !== 'cursor') return step;

      const cursorEl = document.getElementById(step.id);
      const ancestor = cursorEl?.offsetParent as HTMLElement | null;
      if (!cursorEl || !ancestor) return step;

      const waypoints = step.waypoints.map((wp) => {
        if (!wp.target) return wp;
        const targetEl = document.getElementById(wp.target);
        if (!targetEl) {
          console.warn(`[timeline] cursor "${step.id}" target "${wp.target}" not found`);
          return wp;
        }
        const offset = offsetRelativeTo(targetEl, ancestor);
        if (!offset) {
          console.warn(`[timeline] cursor "${step.id}" target "${wp.target}" not in same offset tree`);
          return wp;
        }
        const cx = offset.x + targetEl.offsetWidth / 2;
        const cy = offset.y + targetEl.offsetHeight / 2;
        return {
          ...wp,
          x: Math.round(cx - CURSOR_HOTSPOT_X),
          y: Math.round(cy - CURSOR_HOTSPOT_Y),
        };
      });

      return { ...step, waypoints };
    }),
  };
}
