import type { TimelineConfig } from './types';
import { parseMs } from './parse-ms';

export function generateTimelineCSS(config: TimelineConfig): string {
  const cycleMs = parseMs(config.cycle);
  const cycleStr = typeof config.cycle === 'number' ? `${config.cycle}ms` : config.cycle;
  const introMs = parseMs(config.introHold || '0.36s');
  const outroMs = parseMs(config.outroFade || '0.9s');
  const defaultMetaFadeIn = config.metaFadeIn || '0.36s';
  const defaultMetaHold = config.metaHold || '0.9s';
  const defaultMetaFadeOut = config.metaFadeOut || '0.15s';

  const rules: string[] = [];
  let cursor = introMs;

  // Track widget show times so transition can combine show+hide into one animation
  const widgetShowTimes: Record<string, { startPct: string; endPct: string; slideY: string }> = {};

  // Aggregate multiple cursor steps with the same id into one keyframe
  const cursorData: Record<string, { frames: string[]; lastX: number; lastY: number; initialized: boolean }> = {};

  // Aggregate scroll steps per target — emit one keyframe with all stops
  const scrollData: Record<string, { stops: Array<{ pct: string; ty: number }>; lastY: number }> = {};

  // Aggregate selection (focus border) events per target — supports multiple
  // select/deselect transitions so a field can be "focused" only while typing.
  const selectionData: Record<string, Array<{ pct: string; selected: boolean }>> = {};

  // Aggregate cursor-icon visibility (pointer vs text I-beam) per cursor id.
  // Each waypoint with `mode: 'text'` swaps the inner icon at click time.
  const cursorIconData: Record<string, Array<{ pct: string; opacity: number }>> = {};

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
      // Advance through fadeIn + hold so meta's fadeOut overlaps with whatever
      // comes next (e.g. user message pop). The fadeOut still occurs at its
      // absolute time in the keyframe, but the next step starts in parallel.
      cursor += fadeIn + hold + parseMs(m.pause || '0s');
    }
  }

  for (const step of config.steps) {
    const startPct = pct(cursor);

    if (step.type === 'bot') {
      // Per-line proportional typing: lines is number[] of char counts.
      // Each line's duration = chars / cps so longer lines take longer at the
      // same perceived speed. steps(N) where N = char count gives one tick
      // per character.
      if (Array.isArray(step.lines)) {
        const baseCps = step.cps ?? 45;
        const accel = step.accel ?? 0.8;
        const charCounts = step.lines;
        rules.push(`#${step.id} { clip-path: none; padding-right: 0; }`);
        let lineCursorMs = cursor;
        for (let i = 0; i < charCounts.length; i++) {
          const chars = Math.max(1, charCounts[i]);
          const lineCps = baseCps * Math.pow(accel, i);
          const lineDurMs = (chars / lineCps) * 1000;
          const ls = pct(lineCursorMs);
          const le = pct(lineCursorMs + lineDurMs);
          const lineId = `${step.id}-line-${i + 1}`;
          rules.push(`@keyframes tw-${lineId} {
  0% { clip-path: inset(0 100% 0 0); animation-timing-function: linear; }
  ${ls}% { clip-path: inset(0 100% 0 0); animation-timing-function: steps(${chars}, end); }
  ${le}%, 100% { clip-path: inset(0 0% 0 0); }
}`);
          rules.push(`#${lineId} { animation: tw-${lineId} ${cycleStr} infinite both; }`);
          lineCursorMs += lineDurMs;
        }
        cursor = lineCursorMs;
        if (step.meta) emitMeta(step.meta);
        cursor += parseMs(step.pause || '0s');
      } else {
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
        cursor += dur;
        if (step.meta) emitMeta(step.meta);
        cursor += parseMs(step.pause || '0s');
      }
    }

    else if (step.type === 'meta') {
      emitMeta(step);
    }

    else if (step.type === 'user') {
      const dur = parseMs(step.duration || '0.3s');
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
      // Emit show animation (may be replaced by transition step).
      // `collapse` makes the element take 0 layout space pre-show by animating
      // height (0 → given) and margin-top (negative parent-gap → 0) alongside
      // opacity/translateY, so flex-gap doesn't reserve space for it.
      if (step.collapse) {
        const toH = step.collapse.height;
        const fromMT = step.collapse.marginTop || '0';
        rules.push(`@keyframes show-${step.id} {
  0%, ${startPct}% { opacity: 0; transform: translateY(${slideY}); height: 0; margin-top: ${fromMT}; overflow: hidden; }
  ${endPct}%, 100% { opacity: 1; transform: translateY(0); height: ${toH}; margin-top: 0; overflow: visible; }
}`);
      } else {
        rules.push(`@keyframes show-${step.id} {
  0%, ${startPct}% { opacity: 0; transform: translateY(${slideY}); }
  ${endPct}%, 100% { opacity: 1; transform: translateY(0); }
}`);
      }
      rules.push(`#${step.id} { animation: show-${step.id} ${cycleStr} var(--ease-out-quart) infinite both; }`);
      cursor += dur + parseMs(step.pause || '0s');
    }

    else if (step.type === 'cursor') {
      const waypoints = step.waypoints;
      const id = step.id;

      // Lazily init aggregate for this cursor id
      if (!cursorData[id]) {
        cursorData[id] = { frames: [], lastX: 0, lastY: 0, initialized: false };
      }
      const data = cursorData[id];

      // Reset cursor icon to default (pointer) BEFORE the cursor fades in,
      // so it appears as a pointer regardless of what shape it was previously.
      const pointerIconId = `${id}-pointer`;
      const textIconId = `${id}-text`;
      if (!cursorIconData[pointerIconId]) cursorIconData[pointerIconId] = [{ pct: '0%', opacity: 1 }];
      if (!cursorIconData[textIconId]) cursorIconData[textIconId] = [{ pct: '0%', opacity: 0 }];
      cursorIconData[pointerIconId].push({ pct: `${pct(cursor)}%`, opacity: 1 });
      cursorIconData[textIconId].push({ pct: `${pct(cursor)}%`, opacity: 0 });

      let c = cursor;

      if (!data.initialized) {
        const appear = parseMs(step.appear || '0.3s');
        const startX = step.startX ?? ((waypoints[0]?.x ?? 0) + 60);
        const startY = step.startY ?? ((waypoints[0]?.y ?? 0) + 40);
        data.frames.push(`0%, ${pct(c)}% { opacity: 0; left: ${startX}px; top: ${startY}px; transform: scale(1); }`);
        c += appear;
        data.frames.push(`${pct(c)}% { opacity: 1; left: ${startX}px; top: ${startY}px; transform: scale(1); }`);
        data.lastX = startX;
        data.lastY = startY;
        data.initialized = true;
      } else {
        // Cursor was faded out at end of previous step. Hold hidden at last
        // position, then fade back in for this step.
        data.frames.push(`${pct(c)}% { opacity: 0; left: ${data.lastX}px; top: ${data.lastY}px; transform: scale(1); }`);
        const appear = parseMs(step.appear || '0.18s');
        c += appear;
        data.frames.push(`${pct(c)}% { opacity: 1; left: ${data.lastX}px; top: ${data.lastY}px; transform: scale(1); }`);
      }

      for (const wp of waypoints) {
        const travel = parseMs(wp.travel || '0.5s');
        const click = parseMs(wp.click || '0.12s');
        const wpPause = parseMs(wp.pause || '0.2s');
        const wx = wp.x ?? 0;
        const wy = wp.y ?? 0;

        c += travel;
        data.frames.push(`${pct(c)}% { opacity: 1; left: ${wx}px; top: ${wy}px; transform: scale(1); }`);
        // At click moment, instantly swap icon if waypoint specifies a mode.
        const mode = wp.mode || 'pointer';
        const beforePct = pct(Math.max(c - 50, 0));
        cursorIconData[pointerIconId].push({ pct: `${beforePct}%`, opacity: 1 });
        cursorIconData[pointerIconId].push({ pct: `${pct(c)}%`, opacity: mode === 'text' ? 0 : 1 });
        cursorIconData[textIconId].push({ pct: `${beforePct}%`, opacity: 0 });
        cursorIconData[textIconId].push({ pct: `${pct(c)}%`, opacity: mode === 'text' ? 1 : 0 });
        c += click;
        data.frames.push(`${pct(c)}% { opacity: 1; left: ${wx}px; top: ${wy}px; transform: scale(0.85); }`);

        if (wp.select) {
          // Record select-on. Aggregator emits one keyframe per target after
          // the main loop, allowing later `deselect` steps to release focus.
          if (!selectionData[wp.select]) selectionData[wp.select] = [{ pct: '0%', selected: false }];
          selectionData[wp.select].push({ pct: `${pct(c)}%`, selected: false });
          selectionData[wp.select].push({ pct: `${pct(c + click)}%`, selected: true });
        }

        c += click;
        data.frames.push(`${pct(c)}% { opacity: 1; left: ${wx}px; top: ${wy}px; transform: scale(1); }`);
        c += wpPause;
        data.lastX = wx;
        data.lastY = wy;
      }

      // Fade cursor out at end of step so it disappears while the next thing
      // (typing, attachment slide-in) happens. The next cursor step will fade
      // it back in.
      const disappear = parseMs('0.18s');
      c += disappear;
      data.frames.push(`${pct(c)}% { opacity: 0; left: ${data.lastX}px; top: ${data.lastY}px; transform: scale(1); }`);

      cursor = c;
    }

    else if (step.type === 'scroll') {
      const id = step.target;
      if (!scrollData[id]) {
        scrollData[id] = { stops: [{ pct: '0%', ty: 0 }], lastY: 0 };
      }
      const data = scrollData[id];
      const dur = parseMs(step.duration || '0.5s');
      // Hold at previous Y up to step start, then animate to new Y.
      // pct() returns a number string — append % so the keyframe selector is valid.
      data.stops.push({ pct: `${pct(cursor)}%`, ty: data.lastY });
      data.stops.push({ pct: `${pct(cursor + dur)}%`, ty: step.y });
      data.lastY = step.y;
      cursor += dur + parseMs(step.pause || '0s');
    }

    else if (step.type === 'select') {
      const dur = parseMs(step.duration || '0.15s');
      const endPct = pct(cursor + dur);
      if (!selectionData[step.id]) selectionData[step.id] = [{ pct: '0%', selected: false }];
      selectionData[step.id].push({ pct: `${startPct}%`, selected: false });
      selectionData[step.id].push({ pct: `${endPct}%`, selected: true });
      cursor += dur + parseMs(step.pause || '0s');
    }

    else if (step.type === 'deselect') {
      const dur = parseMs(step.duration || '0.2s');
      const endPct = pct(cursor + dur);
      if (!selectionData[step.target]) selectionData[step.target] = [{ pct: '0%', selected: false }];
      selectionData[step.target].push({ pct: `${startPct}%`, selected: true });
      selectionData[step.target].push({ pct: `${endPct}%`, selected: false });
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

  // Emit aggregated cursor keyframes. Cursor steps end with opacity 0 (faded
  // out), so the 100% stop matches that — no jump on cycle wrap.
  for (const [id, data] of Object.entries(cursorData)) {
    if (!data.initialized) continue;
    data.frames.push(`100% { opacity: 0; left: ${data.lastX}px; top: ${data.lastY}px; transform: scale(1); }`);
    rules.push(`@keyframes move-${id} {\n  ${data.frames.join('\n  ')}\n}`);
    rules.push(`#${id} { animation: move-${id} ${cycleStr} var(--ease-out-quart) infinite both; }`);
  }

  // Emit aggregated scroll keyframes
  for (const [id, data] of Object.entries(scrollData)) {
    data.stops.push({ pct: '100%', ty: data.lastY });
    const frameStrs = data.stops.map(s => `${s.pct} { transform: translateY(${s.ty}px); }`);
    rules.push(`@keyframes scroll-${id} {\n  ${frameStrs.join('\n  ')}\n}`);
    rules.push(`#${id} { animation: scroll-${id} ${cycleStr} var(--ease-scroll) infinite both; }`);
  }

  // Emit aggregated cursor-icon keyframes — pointer ↔ text I-beam swap.
  for (const [id, stops] of Object.entries(cursorIconData)) {
    const last = stops[stops.length - 1];
    stops.push({ pct: '100%', opacity: last.opacity });
    const frameStrs = stops.map(s => `${s.pct} { opacity: ${s.opacity}; }`);
    rules.push(`@keyframes ico-${id} {\n  ${frameStrs.join('\n  ')}\n}`);
    rules.push(`#${id} { animation: ico-${id} ${cycleStr} linear infinite both; }`);
  }

  // Emit aggregated selection (focus border) keyframes — fields turn dark
  // when selected via cursor click, return to subtle when deselected.
  const onShadow = 'inset 0 0 0 2px var(--text-heading)';
  const offShadow = 'inset 0 0 0 1px var(--border-subtle)';
  for (const [id, stops] of Object.entries(selectionData)) {
    const last = stops[stops.length - 1];
    stops.push({ pct: '100%', selected: last.selected });
    const frameStrs = stops.map(s => `${s.pct} { box-shadow: ${s.selected ? onShadow : offShadow}; }`);
    rules.push(`@keyframes sel-${id} {\n  ${frameStrs.join('\n  ')}\n}`);
    rules.push(`#${id} { animation: sel-${id} ${cycleStr} linear infinite both; }`);
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
