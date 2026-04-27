import type { TimelineConfig } from './types';
import { parseMs } from './parse-ms';

export function generateTimelineCSS(config: TimelineConfig): string {
  const cycleMs = parseMs(config.cycle);
  const cycleStr = typeof config.cycle === 'number' ? `${config.cycle}ms` : config.cycle;
  const introMs = parseMs(config.introHold || '0.36s');
  const outroMs = parseMs(config.outroFade || '0.9s');
  const defaultMetaFadeIn = config.metaFadeIn || '0.36s';
  const defaultMetaHold = config.metaHold || '0.9s';
  const defaultMetaFadeOut = config.metaFadeOut || '0.36s';

  const rules: string[] = [];
  let cursor = introMs;

  // Track widget show times so transition can combine show+hide into one animation
  const widgetShowTimes: Record<string, { startPct: string; endPct: string; slideY: string }> = {};

  const pct = (ms: number) => (ms / cycleMs * 100).toFixed(1);

  function emitMeta(m: { id: string; fadeIn?: string | number; hold?: string | number; fadeOut?: string | number; pause?: string | number; parallel?: boolean }) {
    const fadeIn = parseMs(m.fadeIn || defaultMetaFadeIn);
    const hold = parseMs(m.hold || defaultMetaHold);
    const fadeOut = parseMs(m.fadeOut || defaultMetaFadeOut);
    const inStart = pct(cursor);
    const inEnd = pct(cursor + fadeIn);
    const holdEnd = pct(cursor + fadeIn + hold);
    if (fadeOut > 0) {
      const outEnd = pct(cursor + fadeIn + hold + fadeOut);
      rules.push(`@keyframes anim-${m.id} {
  0%, ${inStart}% { opacity: 0; }
  ${inEnd}% { opacity: 1; }
  ${holdEnd}% { opacity: 1; }
  ${outEnd}%, 100% { opacity: 0; }
}`);
    } else {
      rules.push(`@keyframes anim-${m.id} {
  0%, ${inStart}% { opacity: 0; }
  ${inEnd}%, 100% { opacity: 1; }
}`);
    }
    rules.push(`#${m.id} { animation: anim-${m.id} ${cycleStr} var(--ease-out-quart) infinite both; }`);
    if (m.parallel) {
      // Advance only through fadeIn so the next step starts after meta is fully visible
      cursor += fadeIn;
    } else {
      cursor += fadeIn + hold + fadeOut + parseMs(m.pause || '0s');
    }
  }

  for (const step of config.steps) {
    const startPct = pct(cursor);

    if (step.type === 'bot') {
      const dur = parseMs(step.duration || '1.26s');
      const endPct = pct(cursor + dur);

      if (step.lines && step.lines > 1) {
        const lineDur = dur / step.lines;
        rules.push(`#${step.id} { clip-path: none; padding-right: 0; }`);
        for (let i = 0; i < step.lines; i++) {
          const ls = pct(cursor + lineDur * i);
          const le = pct(cursor + lineDur * (i + 1));
          const lineId = `${step.id}-line-${i + 1}`;
          rules.push(`@keyframes tw-${lineId} {
  0% { clip-path: inset(0 100% 0 0); animation-timing-function: linear; }
  ${ls}% { clip-path: inset(0 100% 0 0); animation-timing-function: steps(50, end); }
  ${le}%, 100% { clip-path: inset(0 0% 0 0); }
}`);
          rules.push(`#${lineId} { animation: tw-${lineId} ${cycleStr} infinite both; }`);
        }
      } else {
        rules.push(`@keyframes tw-${step.id} {
  0% { clip-path: inset(0 100% 0 0); animation-timing-function: linear; }
  ${startPct}% { clip-path: inset(0 100% 0 0); animation-timing-function: steps(50, end); }
  ${endPct}%, 100% { clip-path: inset(0 0% 0 0); }
}`);
        rules.push(`#${step.id} { animation: tw-${step.id} ${cycleStr} infinite both; }`);
      }
      cursor += dur + parseMs(step.pause || '0s');

      if (step.meta) emitMeta(step.meta);
    }

    else if (step.type === 'meta') {
      emitMeta(step);
    }

    else if (step.type === 'user') {
      const dur = parseMs(step.duration || '0.54s');
      const endPct = pct(cursor + dur);
      rules.push(`@keyframes pop-${step.id} {
  0%, ${startPct}% { opacity: 0; transform: translate3d(0, 20px, 0) scale(0.85); }
  ${endPct}%, 100% { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
}`);
      rules.push(`#${step.id} { animation: pop-${step.id} ${cycleStr} var(--ease-pop) infinite both; }`);
      cursor += dur + parseMs(step.pause || '0s');
    }

    else if (step.type === 'divider') {
      const dur = parseMs(step.duration || '0.54s');
      const endPct = pct(cursor + dur);
      rules.push(`@keyframes fade-${step.id} {
  0%, ${startPct}% { opacity: 0; }
  ${endPct}%, 100% { opacity: 1; }
}`);
      rules.push(`#${step.id} { animation: fade-${step.id} ${cycleStr} var(--ease-out-quart) infinite both; }`);
      cursor += dur + parseMs(step.pause || '0s');
    }

    else if (step.type === 'widget') {
      const dur = parseMs(step.duration || '0.4s');
      const endPct = pct(cursor + dur);
      const slideY = step.slideY || '8px';
      // Record show timing — if a transition later hides this widget,
      // it will generate a combined show+hide keyframe instead
      widgetShowTimes[step.id] = { startPct, endPct, slideY };
      // Emit show animation (may be replaced by transition step)
      rules.push(`@keyframes show-${step.id} {
  0%, ${startPct}% { opacity: 0; transform: translateY(${slideY}); }
  ${endPct}%, 100% { opacity: 1; transform: translateY(0); }
}`);
      rules.push(`#${step.id} { animation: show-${step.id} ${cycleStr} var(--ease-out-quart) infinite both; }`);
      cursor += dur + parseMs(step.pause || '0s');
    }

    else if (step.type === 'cursor') {
      const waypoints = step.waypoints;
      const appear = parseMs(step.appear || '0.3s');
      const startX = step.startX ?? ((waypoints[0]?.x ?? 0) + 60);
      const startY = step.startY ?? ((waypoints[0]?.y ?? 0) + 40);

      const frames: string[] = [];
      let c = cursor;

      frames.push(`0%, ${pct(c)}% { opacity: 0; left: ${startX}px; top: ${startY}px; transform: scale(1); }`);
      c += appear;
      frames.push(`${pct(c)}% { opacity: 1; left: ${startX}px; top: ${startY}px; transform: scale(1); }`);

      for (const wp of waypoints) {
        const travel = parseMs(wp.travel || '0.5s');
        const click = parseMs(wp.click || '0.12s');
        const wpPause = parseMs(wp.pause || '0.2s');
        const wx = wp.x ?? 0;
        const wy = wp.y ?? 0;

        c += travel;
        frames.push(`${pct(c)}% { opacity: 1; left: ${wx}px; top: ${wy}px; transform: scale(1); }`);
        c += click;
        frames.push(`${pct(c)}% { opacity: 1; left: ${wx}px; top: ${wy}px; transform: scale(0.85); }`);

        if (wp.select) {
          const selTime = pct(c);
          rules.push(`@keyframes sel-${wp.select} {
  0%, ${selTime}% { box-shadow: inset 0 0 0 1px var(--border-subtle); }
  ${pct(c + click)}%, 100% { box-shadow: inset 0 0 0 2px var(--text-heading); }
}`);
          rules.push(`#${wp.select} { animation: sel-${wp.select} ${cycleStr} linear infinite both; }`);
        }

        c += click;
        frames.push(`${pct(c)}% { opacity: 1; left: ${wx}px; top: ${wy}px; transform: scale(1); }`);
        c += wpPause;
      }

      const last = waypoints[waypoints.length - 1];
      frames.push(`100% { opacity: 1; left: ${last?.x ?? 0}px; top: ${last?.y ?? 0}px; transform: scale(1); }`);

      rules.push(`@keyframes move-${step.id} {\n  ${frames.join('\n  ')}\n}`);
      rules.push(`#${step.id} { animation: move-${step.id} ${cycleStr} var(--ease-out-quart) infinite both; }`);
      cursor = c;
    }

    else if (step.type === 'select') {
      const dur = parseMs(step.duration || '0.15s');
      const endPct = pct(cursor + dur);
      rules.push(`@keyframes sel-${step.id} {
  0%, ${startPct}% { box-shadow: inset 0 0 0 1px var(--border-subtle); }
  ${endPct}%, 100% { box-shadow: inset 0 0 0 2px var(--text-heading); }
}`);
      rules.push(`#${step.id} { animation: sel-${step.id} ${cycleStr} linear infinite both; }`);
      cursor += dur + parseMs(step.pause || '0s');
    }

    else if (step.type === 'transition') {
      const dur = parseMs(step.duration || '0.4s');
      const endPct = pct(cursor + dur);

      // If hiding an element that was shown by a widget step,
      // replace its show animation with a combined show+hide
      const showInfo = widgetShowTimes[step.hide];
      const slideOutY = step.slideOutY || '-6px';
      if (showInfo) {
        rules.push(`@keyframes show-${step.hide} {
  0%, ${showInfo.startPct}% { opacity: 0; transform: translateY(${showInfo.slideY}); }
  ${showInfo.endPct}% { opacity: 1; transform: translateY(0); }
  ${startPct}% { opacity: 1; transform: translateY(0); }
  ${endPct}%, 100% { opacity: 0; transform: translateY(${slideOutY}); }
}`);
        // No need to push a new selector — the widget step already emitted #id { animation: show-id ... }
      } else {
        rules.push(`@keyframes hide-${step.hide} {
  0%, ${startPct}% { opacity: 1; transform: translateY(0); }
  ${endPct}%, 100% { opacity: 0; transform: translateY(${slideOutY}); }
}`);
        rules.push(`#${step.hide} { animation: hide-${step.hide} ${cycleStr} var(--ease-out-quart) infinite both; }`);
      }

      rules.push(`@keyframes show-${step.show} {
  0%, ${startPct}% { opacity: 0; transform: translateY(8px); }
  ${endPct}%, 100% { opacity: 1; transform: translateY(0); }
}`);
      rules.push(`#${step.show} { animation: show-${step.show} ${cycleStr} var(--ease-out-quart) infinite both; }`);
      cursor += dur + parseMs(step.pause || '0s');
    }
  }

  // stackFadeCycle
  const fadeInEnd = pct(introMs);
  const fadeOutStart = pct(cycleMs - outroMs - parseMs('0.9s'));
  const fadeOutEnd = pct(cycleMs - parseMs('0.9s'));
  rules.push(`@keyframes stackFadeCycle {
  0% { opacity: 0; }
  ${fadeInEnd}% { opacity: 1; }
  ${fadeOutStart}% { opacity: 1; }
  ${fadeOutEnd}%, 100% { opacity: 0; }
}`);
  rules.push(`.messagesStack { animation: stackFadeCycle ${cycleStr} linear infinite both; will-change: transform, opacity; }`);

  return rules.join('\n');
}
