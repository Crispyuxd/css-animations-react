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

// Bounding-rect-based resolver: works regardless of positioned-ancestor topology
// between cursor and target (single shared cursor at chat-card level needs this
// because targets across states and sheets don't share offsetParent chains).
function rectRelativeTo(el: HTMLElement, ancestor: HTMLElement): { x: number; y: number; w: number; h: number } {
  const elR = el.getBoundingClientRect();
  const ancR = ancestor.getBoundingClientRect();
  return { x: elR.left - ancR.left, y: elR.top - ancR.top, w: elR.width, h: elR.height };
}

function resolveCursorTargets(config: TimelineConfig): TimelineConfig {
  if (typeof document === 'undefined') return config;

  // Walk steps in order, tracking the active scroll value per container so
  // each cursor step gets the scroll offset that was actually in effect at
  // its place in the timeline. The cursor sits at chat-card level (outside
  // scroll containers), so when it targets an element inside one we add the
  // active scroll translate to compensate — otherwise it lands on the
  // pre-scroll layout position. (A previous version pre-computed only the
  // final scroll value per container, which broke any timeline with multiple
  // scrolls on the same container — every click after the first scroll used
  // the LAST scroll's value, not the value active at click time.)
  const currentScroll: Record<string, { x: number; y: number }> = {};

  return {
    ...config,
    steps: config.steps.map((step) => {
      if (step.type === 'scroll') {
        currentScroll[step.target] = { x: 0, y: step.y };
        return step;
      }
      if (step.type !== 'cursor') return step;

      const cursorEl = document.getElementById(step.id);
      const ancestor = cursorEl?.offsetParent as HTMLElement | null;
      if (!cursorEl || !ancestor) return step;

      // Snapshot scroll state at this cursor step's place in the timeline.
      const scrollSnapshot = { ...currentScroll };

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
        let cx = offset.x + targetEl.offsetWidth / 2;
        let cy = offset.y + targetEl.offsetHeight / 2;
        for (const [scrollId, sOff] of Object.entries(scrollSnapshot)) {
          const scrollEl = document.getElementById(scrollId);
          // Only compensate when the cursor is OUTSIDE the scroll container.
          // If the cursor itself lives inside the scrolled element (forms
          // demo: DemoCursor is mounted inside FormCard inside forms-scroll),
          // it moves WITH the scroll already — adding the scroll offset would
          // double-apply it and send the cursor off-screen.
          if (
            scrollEl &&
            scrollEl !== targetEl &&
            scrollEl.contains(targetEl) &&
            !scrollEl.contains(cursorEl)
          ) {
            cx += sOff.x;
            cy += sOff.y;
          }
        }
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
