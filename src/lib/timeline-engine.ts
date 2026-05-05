import type { TimelineConfig } from './types';
import { parseMs } from './parse-ms';

/**
 * Damped-spring polyline for CSS `linear()` timing function.
 * Underdamped (zeta < 1) gives one or two overshoots before settling — much
 * more "alive" than any single cubic-bezier curve, since real bezier can't
 * encode oscillation. Sampled at 24 stops, normalized 0→1 over the segment.
 *
 * ω (omega) = natural frequency in normalized time. Higher = snappier.
 * ζ (zeta)  = damping ratio. < 1 underdamped (overshoots), 1 critical, > 1 over.
 */
function springLinear(omega = 8, zeta = 0.62, samples = 24): string {
  const wd = omega * Math.sqrt(1 - zeta * zeta);
  const out: string[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const env = Math.exp(-zeta * omega * t);
    const x = 1 - env * (Math.cos(wd * t) + (zeta * omega / wd) * Math.sin(wd * t));
    out.push(x.toFixed(4));
  }
  return `linear(${out.join(', ')})`;
}

/**
 * Human-typing-cadence polyline. Replaces the rigid `steps(N, end)` reveal
 * with a monotonic curve that has gentle bursts and micro-pauses — feels
 * like fingers on a keyboard, not a metronome. Variation is sinusoidal,
 * tapered toward the end so the line lands cleanly.
 */
function humanCadenceLinear(samples = 28): string {
  const out: string[] = [];
  let prev = 0;
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    // Two overlapping sinusoids → unevenly spaced bursts. Amplitude tapers as
    // the line approaches its end so the final character lands on time.
    const v1 = 0.05 * Math.sin(t * Math.PI * 5);
    const v2 = 0.03 * Math.sin(t * Math.PI * 11 + 0.7);
    const taper = 1 - t * 0.7;
    const x = Math.max(prev, Math.min(1, t + (v1 + v2) * taper));
    prev = x;
    out.push(x.toFixed(4));
  }
  // Force endpoints exact so the wipe lands on the last character.
  out[0] = '0';
  out[out.length - 1] = '1';
  return `linear(${out.join(', ')})`;
}

export function generateTimelineCSS(config: TimelineConfig): string {
  const cycleMs = parseMs(config.cycle);
  const cycleStr = typeof config.cycle === 'number' ? `${config.cycle}ms` : config.cycle;
  const introMs = parseMs(config.introHold || '0.36s');
  const outroMs = parseMs(config.outroFade || '0.9s');
  const defaultMetaFadeIn = config.metaFadeIn || '0.36s';
  const defaultMetaHold = config.metaHold || '0.9s';
  const defaultMetaFadeOut = config.metaFadeOut || '0.36s';
  const smooth = config.smoothMode === true;
  // In smoothMode, animated selectors get will-change so the compositor
  // promotes them to their own layer up front, avoiding first-frame jank.
  const wcTransOp = smooth ? ' will-change: transform, opacity;' : '';
  const wcOp = smooth ? ' will-change: opacity;' : '';

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

  // Anticipation pulse on click targets — target subtly scales as the cursor
  // arrives, then settles. Disney-12 anticipation principle: the receiving
  // element acknowledges incoming intent. smoothMode only.
  const pulseData: Record<string, Array<{ pct: string; scale: number }>> = {};

  // Pre-compute the spring polyline once — reused on every cursor travel.
  const springTF = smooth ? springLinear() : '';

  // smoothMode: 3 decimals (~0.001% on 30s ≈ 0.3ms) eliminates the 30ms
  // quantization snap visible in the legacy 1-decimal output.
  const pct = (ms: number) => (ms / cycleMs * 100).toFixed(smooth ? 3 : 1);

  function emitMeta(m: { id: string; fadeIn?: string | number; hold?: string | number; fadeOut?: string | number; pause?: string | number; parallel?: boolean }) {
    const fadeIn = parseMs(m.fadeIn || defaultMetaFadeIn);
    const hold = parseMs(m.hold || defaultMetaHold);
    const fadeOut = parseMs(m.fadeOut || defaultMetaFadeOut);

    // smoothMode: stagger MetaRow children so timestamp, divider, and the two
    // thumbs icons fade in one after another with a tiny rise. MetaRow has 4
    // children in this order. Reactions hold at opacity 0.5 to keep their
    // muted look (matches static CSS).
    if (smooth) {
      const childCount = 4;
      const stagger = 70;
      const childDur = Math.max(fadeIn, 220);
      const targetOpacities = [1, 1, 0.5, 0.5];
      for (let i = 1; i <= childCount; i++) {
        const cs = pct(cursor + (i - 1) * stagger);
        const ce = pct(cursor + (i - 1) * stagger + childDur);
        const target = targetOpacities[i - 1];
        const kfName = `meta-${m.id}-c${i}`;
        if (fadeOut > 0) {
          const outStart = pct(cursor + fadeIn + hold);
          const outEnd = pct(cursor + fadeIn + hold + fadeOut);
          rules.push(`@keyframes ${kfName} {
  0%, ${cs}% { opacity: 0; transform: translateY(4px); }
  ${ce}% { opacity: ${target}; transform: translateY(0); }
  ${outStart}% { opacity: ${target}; transform: translateY(0); }
  ${outEnd}%, 100% { opacity: 0; transform: translateY(0); }
}`);
        } else {
          rules.push(`@keyframes ${kfName} {
  0%, ${cs}% { opacity: 0; transform: translateY(4px); }
  ${ce}%, 100% { opacity: ${target}; transform: translateY(0); }
}`);
        }
        rules.push(`#${m.id} > *:nth-child(${i}) { animation: ${kfName} ${cycleStr} cubic-bezier(0.16, 1, 0.3, 1) infinite both;${wcTransOp} }`);
      }
      // Parent stays visible — children carry the fade.
      rules.push(`#${m.id} { opacity: 1; }`);
    } else {
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
      rules.push(`#${m.id} { animation: anim-${m.id} ${cycleStr} var(--ease-out-quart) infinite both;${wcOp} }`);
    }

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
      // Word-fade mode: each word is a [data-word] span, animated by id with
      // a stagger cascade. Each word fades in (opacity 0→1, translateY 3→0,
      // blur 2px→0). Reads as LLM-streamed rather than typed-by-bot.
      if (step.mode === 'words' && step.wordCount && step.wordCount > 0) {
        const stagger = parseMs(step.wordStagger || '40ms');
        const wordDur = parseMs(step.wordDuration || '0.28s');
        for (let i = 1; i <= step.wordCount; i++) {
          const wStart = cursor + (i - 1) * stagger;
          const wEnd = wStart + wordDur;
          const ws = pct(wStart);
          const we = pct(wEnd);
          rules.push(`@keyframes wf-${step.id}-w-${i} {
  0%, ${ws}% { opacity: 0; transform: translateY(3px); filter: blur(2px); }
  ${we}%, 100% { opacity: 1; transform: translateY(0); filter: blur(0); }
}`);
          rules.push(`#${step.id}-w-${i} { animation: wf-${step.id}-w-${i} ${cycleStr} cubic-bezier(0.16, 1, 0.3, 1) infinite both; }`);
        }
        const totalMs = (step.wordCount - 1) * stagger + wordDur;
        cursor += totalMs + parseMs(step.pause || '0s');
        if (step.meta) emitMeta(step.meta);
      }
      // Per-line proportional typing: lines is number[] of char counts.
      // Each line's duration = chars / cps so longer lines take longer at the
      // same perceived speed. steps(N) where N = char count gives one tick
      // per character.
      else if (Array.isArray(step.lines)) {
        const cps = step.cps ?? 35;
        const charCounts = step.lines;
        // smoothMode: each successive line begins 50ms before the previous
        // finishes — braided typing reads more natural than strictly serial.
        const overlapMs = smooth ? 50 : 0;
        rules.push(`#${step.id} { clip-path: none; padding-right: 0; }`);
        let lineCursorMs = cursor;
        for (let i = 0; i < charCounts.length; i++) {
          const chars = Math.max(1, charCounts[i]);
          const lineDurMs = (chars / cps) * 1000;
          const ls = pct(lineCursorMs);
          const le = pct(lineCursorMs + lineDurMs);
          const lineId = `${step.id}-line-${i + 1}`;
          rules.push(`@keyframes tw-${lineId} {
  0% { clip-path: inset(0 100% 0 0); animation-timing-function: linear; }
  ${ls}% { clip-path: inset(0 100% 0 0); animation-timing-function: steps(${chars}, end); }
  ${le}%, 100% { clip-path: inset(0 0% 0 0); }
}`);
          rules.push(`#${lineId} { animation: tw-${lineId} ${cycleStr} infinite both; }`);
          // Advance — subtract overlap from all but the last line so the next
          // line starts before this one ends. Last line: full duration so the
          // bot's pause/meta begins at the actual finish.
          lineCursorMs += lineDurMs - (i < charCounts.length - 1 ? overlapMs : 0);
        }
        cursor = lineCursorMs + parseMs(step.pause || '0s');
        if (step.meta) emitMeta(step.meta);
      } else {
        const dur = parseMs(step.duration || '1.26s');
        const endPct = pct(cursor + dur);

        if (step.lines && step.lines > 1) {
          const lineDur = dur / step.lines;
          // smoothMode: shift each successive line back by overlapMs so it
          // starts before the previous finishes.
          const overlapMs = smooth ? 50 : 0;
          rules.push(`#${step.id} { clip-path: none; padding-right: 0; }`);
          for (let i = 0; i < step.lines; i++) {
            const startMs = cursor + lineDur * i - overlapMs * i;
            const ls = pct(startMs);
            const le = pct(startMs + lineDur);
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
      rules.push(`#${step.id} { animation: pop-${step.id} ${cycleStr} var(--ease-pop) infinite both;${wcTransOp} }`);
      cursor += dur + parseMs(step.pause || '0s');
    }

    else if (step.type === 'divider') {
      const dur = parseMs(step.duration || '0.54s');
      const endPct = pct(cursor + dur);
      rules.push(`@keyframes fade-${step.id} {
  0%, ${startPct}% { opacity: 0; }
  ${endPct}%, 100% { opacity: 1; }
}`);
      rules.push(`#${step.id} { animation: fade-${step.id} ${cycleStr} var(--ease-out-quart) infinite both;${wcOp} }`);
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
      // smoothMode: drive the show segment with the spring polyline. Two-stop
      // keyframe (0→1) is enough — the spring's overshoot+settle is encoded
      // in the timing function, not the keyframe stops. Same motion language
      // as the cursor.
      // Collapse mode: also animates max-height + margin-top so the item
      // takes ZERO layout space until it shows. Negative margin-top consumes
      // the parent flex gap. overflow: hidden must be set on the element.
      const collapseTo = step.collapse ? (step.collapseTo || '60px') : null;
      const collapseGap = step.collapse ? (step.collapseGap || '16px') : null;
      const collapseStart = collapseTo ? ` max-height: 0; margin-top: -${collapseGap};` : '';
      const collapseEnd = collapseTo ? ` max-height: ${collapseTo}; margin-top: 0;` : '';

      if (smooth) {
        rules.push(`@keyframes show-${step.id} {
  0%, ${startPct}% { opacity: 0; transform: translateY(${slideY}) scale(0.99);${collapseStart} animation-timing-function: ${springTF}; }
  ${endPct}%, 100% { opacity: 1; transform: translateY(0) scale(1);${collapseEnd} }
}`);
      } else {
        rules.push(`@keyframes show-${step.id} {
  0%, ${startPct}% { opacity: 0; transform: translateY(${slideY});${collapseStart} }
  ${endPct}%, 100% { opacity: 1; transform: translateY(0);${collapseEnd} }
}`);
      }
      rules.push(`#${step.id} { animation: show-${step.id} ${cycleStr} var(--ease-out-quart) infinite both;${wcTransOp}${step.collapse ? ' overflow: hidden;' : ''} }`);

      // smoothMode + shimmer flag: emit a radial shimmer keyframe on a child
      // [data-shimmer] overlay that fires alongside the widget's entry.
      // 200ms pulse scaled 0.5 → 1.6, opacity 0 → 1 → 0.
      if (smooth && step.shimmer) {
        const shimmerStart = pct(cursor);
        const shimmerPeak = pct(cursor + dur * 0.5);
        const shimmerEnd = pct(cursor + dur + parseMs('0.3s'));
        rules.push(`@keyframes shimmer-${step.id} {
  0%, ${shimmerStart}% { opacity: 0; transform: scale(0.4); }
  ${shimmerPeak}% { opacity: 1; transform: scale(1); }
  ${shimmerEnd}%, 100% { opacity: 0; transform: scale(1.7); }
}`);
        rules.push(`#${step.id} [data-shimmer] { animation: shimmer-${step.id} ${cycleStr} cubic-bezier(0.16, 1, 0.3, 1) infinite both;${wcTransOp} }`);
      }

      cursor += dur + parseMs(step.pause || '0s');
    }

    else if (step.type === 'cursor') {
      const waypoints = step.waypoints;
      const id = step.id;

      // smoothMode: drive position with translate3d so the cursor stays on the
      // compositor (no layout per frame). Legacy: left/top, which triggers
      // layout every frame and is the single biggest jank source on fast
      // traversals.
      const posScale = (x: number, y: number, s: number) =>
        smooth
          ? `transform: translate3d(${x}px, ${y}px, 0) scale(${s});`
          : `left: ${x}px; top: ${y}px; transform: scale(${s});`;

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

      // Tag the keyframe segment AFTER this stop with a custom TF override.
      // The cursor's base TF (var(--ease-out-quart)) applies to all other
      // segments. smoothMode only.
      const tfClause = (tf: string) => smooth ? ` animation-timing-function: ${tf};` : '';

      if (!data.initialized) {
        const appear = parseMs(step.appear || '0.3s');
        const startX = step.startX ?? ((waypoints[0]?.x ?? 0) + 60);
        const startY = step.startY ?? ((waypoints[0]?.y ?? 0) + 40);
        data.frames.push(`0%, ${pct(c)}% { opacity: 0; ${posScale(startX, startY, 1)} }`);
        c += appear;
        // The travel after this stop is the segment we want to spring.
        data.frames.push(`${pct(c)}% { opacity: 1; ${posScale(startX, startY, 1)}${tfClause(springTF)} }`);
        data.lastX = startX;
        data.lastY = startY;
        data.initialized = true;
      } else {
        // Cursor was faded out at end of previous step. Hold hidden at last
        // position, then fade back in for this step.
        data.frames.push(`${pct(c)}% { opacity: 0; ${posScale(data.lastX, data.lastY, 1)} }`);
        const appear = parseMs(step.appear || '0.18s');
        c += appear;
        data.frames.push(`${pct(c)}% { opacity: 1; ${posScale(data.lastX, data.lastY, 1)}${tfClause(springTF)} }`);
      }

      for (const wp of waypoints) {
        const travel = parseMs(wp.travel || '0.5s');
        const click = parseMs(wp.click || '0.12s');
        const wpPause = parseMs(wp.pause || '0.2s');
        const wx = wp.x ?? 0;
        const wy = wp.y ?? 0;

        c += travel;
        // After travel ends, the next segment is click compress (scale 0.85).
        // A snappy ease-in feels right for the press; the bounce-back from
        // 0.85→1 gets a slight overshoot.
        data.frames.push(`${pct(c)}% { opacity: 1; ${posScale(wx, wy, 1)}${tfClause('cubic-bezier(0.4, 0, 1, 1)')} }`);
        // At click moment, instantly swap icon if waypoint specifies a mode.
        const mode = wp.mode || 'pointer';
        const beforePct = pct(Math.max(c - 50, 0));
        cursorIconData[pointerIconId].push({ pct: `${beforePct}%`, opacity: 1 });
        cursorIconData[pointerIconId].push({ pct: `${pct(c)}%`, opacity: mode === 'text' ? 0 : 1 });
        cursorIconData[textIconId].push({ pct: `${beforePct}%`, opacity: 0 });
        cursorIconData[textIconId].push({ pct: `${pct(c)}%`, opacity: mode === 'text' ? 1 : 0 });
        c += click;
        data.frames.push(`${pct(c)}% { opacity: 1; ${posScale(wx, wy, 0.85)}${tfClause('cubic-bezier(0.34, 1.56, 0.64, 1)')} }`);

        if (wp.select) {
          // Record select-on. Aggregator emits one keyframe per target after
          // the main loop, allowing later `deselect` steps to release focus.
          if (!selectionData[wp.select]) selectionData[wp.select] = [{ pct: '0%', selected: false }];
          selectionData[wp.select].push({ pct: `${pct(c)}%`, selected: false });
          selectionData[wp.select].push({ pct: `${pct(c + click)}%`, selected: true });

          // Anticipation pulse: target scales 1 → 1.012 → 1 around the click.
          // c here is right after the click compress (scale 0.85 frame). The
          // peak coincides with the cursor's deepest press for a tactile feel.
          if (smooth) {
            const pulseStart = Math.max(c - travel * 0.25, 0);
            const pulsePeak = c;
            const pulseEnd = c + click * 2;
            if (!pulseData[wp.select]) pulseData[wp.select] = [{ pct: '0%', scale: 1 }];
            pulseData[wp.select].push({ pct: `${pct(pulseStart)}%`, scale: 1 });
            pulseData[wp.select].push({ pct: `${pct(pulsePeak)}%`, scale: 1.012 });
            pulseData[wp.select].push({ pct: `${pct(pulseEnd)}%`, scale: 1 });
          }
        }

        c += click;
        data.frames.push(`${pct(c)}% { opacity: 1; ${posScale(wx, wy, 1)} }`);
        c += wpPause;
        data.lastX = wx;
        data.lastY = wy;
      }

      // Fade cursor out at end of step so it disappears while the next thing
      // (typing, attachment slide-in) happens. The next cursor step will fade
      // it back in.
      const disappear = parseMs('0.18s');
      c += disappear;
      data.frames.push(`${pct(c)}% { opacity: 0; ${posScale(data.lastX, data.lastY, 1)} }`);

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

      // smoothMode: emit a coordinated MORPH instead of a plain cross-fade.
      // The hidden element scales down and tilts as it fades; the shown
      // element materializes from the same compressed pose with a brief
      // blur clear, so the eye reads it as a single shape transforming.
      // Both elements meet at scale 0.88 for a moment of visual continuity.
      const showInfo = widgetShowTimes[step.hide];
      const slideOutY = step.slideOutY || '-6px';
      const morphMidPct = pct(cursor + dur * 0.55);
      const morphShowStartPct = pct(cursor + dur * 0.30);

      if (smooth) {
        // Hide path: shrink + tilt-right + blur out. Eased-in so the motion
        // accelerates into the morph midpoint.
        if (showInfo) {
          rules.push(`@keyframes show-${step.hide} {
  0%, ${showInfo.startPct}% { opacity: 0; transform: translateY(${showInfo.slideY}) scale(0.99); animation-timing-function: ${springTF}; }
  ${showInfo.endPct}% { opacity: 1; transform: translateY(0) scale(1); }
  ${startPct}% { opacity: 1; transform: scale(1) rotate(0); filter: blur(0); animation-timing-function: cubic-bezier(0.5, 0, 0.75, 0); }
  ${morphMidPct}% { opacity: 0; transform: scale(0.86) rotate(2deg); filter: blur(1.5px); }
  ${endPct}%, 100% { opacity: 0; transform: scale(0.86) rotate(2deg); filter: blur(1.5px); }
}`);
        } else {
          rules.push(`@keyframes hide-${step.hide} {
  0%, ${startPct}% { opacity: 1; transform: scale(1) rotate(0); filter: blur(0); animation-timing-function: cubic-bezier(0.5, 0, 0.75, 0); }
  ${morphMidPct}% { opacity: 0; transform: scale(0.86) rotate(2deg); filter: blur(1.5px); }
  ${endPct}%, 100% { opacity: 0; transform: scale(0.86) rotate(2deg); filter: blur(1.5px); }
}`);
          rules.push(`#${step.hide} { animation: hide-${step.hide} ${cycleStr} linear infinite both;${wcTransOp} }`);
        }
        // Show path: starts compressed in the OPPOSITE rotation, blurred,
        // begins ~30% into the window so it overlaps with the hide. Spring
        // resolves it to the rest pose.
        rules.push(`@keyframes show-${step.show} {
  0%, ${morphShowStartPct}% { opacity: 0; transform: scale(0.88) rotate(-1.5deg); filter: blur(1px); animation-timing-function: ${springTF}; }
  ${endPct}%, 100% { opacity: 1; transform: scale(1) rotate(0); filter: blur(0); }
}`);
        rules.push(`#${step.show} { animation: show-${step.show} ${cycleStr} linear infinite both;${wcTransOp} }`);
      } else {
        // Legacy path — plain translateY cross-fade.
        if (showInfo) {
          rules.push(`@keyframes show-${step.hide} {
  0%, ${showInfo.startPct}% { opacity: 0; transform: translateY(${showInfo.slideY}); }
  ${showInfo.endPct}% { opacity: 1; transform: translateY(0); }
  ${startPct}% { opacity: 1; transform: translateY(0); }
  ${endPct}%, 100% { opacity: 0; transform: translateY(${slideOutY}); }
}`);
        } else {
          rules.push(`@keyframes hide-${step.hide} {
  0%, ${startPct}% { opacity: 1; transform: translateY(0); }
  ${endPct}%, 100% { opacity: 0; transform: translateY(${slideOutY}); }
}`);
          rules.push(`#${step.hide} { animation: hide-${step.hide} ${cycleStr} var(--ease-out-quart) infinite both;${wcTransOp} }`);
        }
        rules.push(`@keyframes show-${step.show} {
  0%, ${startPct}% { opacity: 0; transform: translateY(8px); }
  ${endPct}%, 100% { opacity: 1; transform: translateY(0); }
}`);
        rules.push(`#${step.show} { animation: show-${step.show} ${cycleStr} var(--ease-out-quart) infinite both;${wcTransOp} }`);
      }
      cursor += dur + parseMs(step.pause || '0s');
    }
  }

  // Emit aggregated cursor keyframes. Cursor steps end with opacity 0 (faded
  // out), so the 100% stop matches that — no jump on cycle wrap.
  for (const [id, data] of Object.entries(cursorData)) {
    if (!data.initialized) continue;
    const closingPos = smooth
      ? `transform: translate3d(${data.lastX}px, ${data.lastY}px, 0) scale(1);`
      : `left: ${data.lastX}px; top: ${data.lastY}px; transform: scale(1);`;
    data.frames.push(`100% { opacity: 0; ${closingPos} }`);
    rules.push(`@keyframes move-${id} {\n  ${data.frames.join('\n  ')}\n}`);
    rules.push(`#${id} { animation: move-${id} ${cycleStr} var(--ease-out-quart) infinite both;${wcTransOp} }`);
  }

  // Emit aggregated scroll keyframes
  for (const [id, data] of Object.entries(scrollData)) {
    data.stops.push({ pct: '100%', ty: data.lastY });
    const frameStrs = data.stops.map(s => `${s.pct} { transform: translateY(${s.ty}px); }`);
    rules.push(`@keyframes scroll-${id} {\n  ${frameStrs.join('\n  ')}\n}`);
    rules.push(`#${id} { animation: scroll-${id} ${cycleStr} var(--ease-scroll) infinite both;${wcTransOp} }`);
  }

  // Emit aggregated cursor-icon keyframes — pointer ↔ text I-beam swap.
  for (const [id, stops] of Object.entries(cursorIconData)) {
    const last = stops[stops.length - 1];
    stops.push({ pct: '100%', opacity: last.opacity });
    const frameStrs = stops.map(s => `${s.pct} { opacity: ${s.opacity}; }`);
    rules.push(`@keyframes ico-${id} {\n  ${frameStrs.join('\n  ')}\n}`);
    rules.push(`#${id} { animation: ico-${id} ${cycleStr} linear infinite both; }`);
  }

  // Emit aggregated anticipation pulse keyframes — target scale 1 → 1.012 → 1
  // around each cursor click. Composite-only (transform). smoothMode only.
  for (const [id, stops] of Object.entries(pulseData)) {
    const last = stops[stops.length - 1];
    stops.push({ pct: '100%', scale: last.scale });
    const frameStrs = stops.map(s => `${s.pct} { transform: scale(${s.scale}); }`);
    rules.push(`@keyframes pulse-${id} {\n  ${frameStrs.join('\n  ')}\n}`);
    rules.push(`#${id} { animation: pulse-${id} ${cycleStr} cubic-bezier(0.4, 0, 0.2, 1) infinite both;${wcTransOp} }`);
  }

  // Emit aggregated selection (focus border) keyframes — fields turn dark
  // when selected via cursor click, return to subtle when deselected.
  // smoothMode: tween opacity on a sibling [data-ring] overlay (composite-only)
  // instead of animating box-shadow on the parent (paint per frame).
  const onShadow = 'inset 0 0 0 2px var(--text-heading)';
  const offShadow = 'inset 0 0 0 1px var(--border-subtle)';
  for (const [id, stops] of Object.entries(selectionData)) {
    const last = stops[stops.length - 1];
    stops.push({ pct: '100%', selected: last.selected });
    if (smooth) {
      const frameStrs = stops.map(s => `${s.pct} { opacity: ${s.selected ? 1 : 0}; }`);
      rules.push(`@keyframes sel-${id} {\n  ${frameStrs.join('\n  ')}\n}`);
      rules.push(`#${id} [data-ring] { animation: sel-${id} ${cycleStr} linear infinite both;${wcOp} }`);
    } else {
      const frameStrs = stops.map(s => `${s.pct} { box-shadow: ${s.selected ? onShadow : offShadow}; }`);
      rules.push(`@keyframes sel-${id} {\n  ${frameStrs.join('\n  ')}\n}`);
      rules.push(`#${id} { animation: sel-${id} ${cycleStr} linear infinite both; }`);
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

  // smoothMode: cycle-wrap breath on the chat card itself — subtle scale +
  // opacity dip at start/end of each cycle so the loop doesn't visibly snap.
  if (smooth) {
    const breathInPct = pct(parseMs('0.25s'));
    const breathOutStartPct = pct(cycleMs - parseMs('0.25s'));
    rules.push(`@keyframes chatCardWrap {
  0% { opacity: 0.94; transform: scale(0.992); }
  ${breathInPct}% { opacity: 1; transform: scale(1); }
  ${breathOutStartPct}% { opacity: 1; transform: scale(1); }
  100% { opacity: 0.94; transform: scale(0.992); }
}`);
    rules.push(`.chatCard { animation: chatCardWrap ${cycleStr} cubic-bezier(0.4, 0, 0.2, 1) infinite both; will-change: transform, opacity; }`);
  }

  return rules.join('\n');
}
