import type { TimelineConfig } from './types';
import { parseMs } from './parse-ms';

// Typewriter constants, ported verbatim from the Chatbase product widget
// (chatbase-website/src/components/integrations-page/channel-demos/sunshine/
// typewriter.tsx → TYPEWRITER_CPS / TYPEWRITER_LINE_ACCEL /
// TYPEWRITER_LINE_GAP_MS). Streaming reads as accelerating: each successive
// line is 45% faster than the base, with a beat of silence between lines.
const TYPEWRITER_CPS = 90;
const TYPEWRITER_LINE_ACCEL = 0.45;
const TYPEWRITER_LINE_GAP_MS = 120;

// User-bubble pop, ported from the product widget (sunshine/chat-bubble.tsx
// ChatBubble variant="user"): y +20 to 0, scale 0.85 to 1 on --ease-pop.
// The bubble has a solid fill, so opacity is a near-instant cut rather than a
// cross-fade — fading a filled bubble across the whole move makes the fill
// wash out mid-flight and reads as two effects instead of one pop.
const USER_POP_MS = 480;
const USER_OPACITY_CUT_MS = 100;

// Trace-off pending indicator, ported from the product widget
// (chatbase-agents `MessageTrace status="thinking" steps={[]}`, Storybook
// UI/Message Trace → Thinking No Trace). The widget mounts it with
// `fade-in 200ms ease-out both` while awaiting a reply and unmounts it the
// moment the reply lands, so the exit is a hard cut, not a fade.
const THINKING_FADE_IN_MS = 200;
const THINKING_DWELL_MS = 1200;

// Per-line speed. LINEAR in the line index (90 → 130.5 → 171 …), not
// compounding — matches the product's `baseCps * (1 + index * accel)`.
// A negative accel decelerates instead, which is how a human typist reads
// (escalation's Mark Kent, forms' textarea).
//
// The multiplier is floored because a decelerating accel crosses zero on a long
// enough message (accel -0.08 does it at line 14), and a zero or negative cps
// would make `chars / cps` Infinity or negative, emitting `Infinity%` keyframe
// stops that silently break the whole demo. 0.1 is already a 10x slowdown, far
// past anything readable, so the clamp never alters a real timeline: today's
// slowest line is forms' sixth at 0.6.
const LINE_CPS_MIN_FACTOR = 0.1;
const lineCps = (baseCps: number, index: number, accel: number) =>
  baseCps * Math.max(LINE_CPS_MIN_FACTOR, 1 + index * accel);

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

  // Aggregate multiple cursor steps with the same id into one keyframe.
  // `parked` indicates the previous cursor step ended at a rest position with
  // opacity 1 (instead of fading out), so the next step skips the fade-in.
  const cursorData: Record<string, { frames: string[]; lastX: number; lastY: number; initialized: boolean; parked: boolean }> = {};

  // Aggregate scroll steps per target — emit one keyframe with all stops
  const scrollData: Record<string, { stops: Array<{ pct: string; ty: number }>; lastY: number }> = {};

  // Aggregate selection (focus border) events per target — supports multiple
  // select/deselect transitions so a field can be "focused" only while typing.
  const selectionData: Record<string, Array<{ pct: string; selected: boolean }>> = {};

  // Aggregate cursor-icon visibility (pointer vs text I-beam) per cursor id.
  // Each waypoint with `mode: 'text'` swaps the inner icon at click time.
  const cursorIconData: Record<string, Array<{ pct: string; opacity: number }>> = {};

  // Aggregator for typewriter lines (array-lines bot mode). We defer keyframe
  // emission so a later `untype` step can extend the same keyframe with
  // backspace stops — running two animations on `clip-path` would conflict,
  // so a single keyframe per line is the only correct approach.
  const lineTypeData: Record<string, { chars: number; lsMs: number; leMs: number; bsMs?: number; beMs?: number }> = {};

  // Anticipation pulse on click targets — the receiving element subtly
  // scales as the cursor arrives. Composite-only (transform). Disney-12
  // anticipation principle: target acknowledges incoming intent.
  const pulseData: Record<string, Array<{ pct: string; scale: number }>> = {};

  // Hover state that crossfades in as the cursor approaches the target and
  // out across the click as `select` takes over. Requires a [data-hover]
  // overlay on the target; optional [data-hover-text] receives a text-color
  // tween towards var(--hover-text-color).
  const hoverData: Record<string, Array<{ pct: string; opacity: number }>> = {};

  const pct = (ms: number) => (ms / cycleMs * 100).toFixed(1);
  // Higher-precision pct for caret transition stops — toFixed(1) collides on
  // sub-millisecond gaps over long cycles (35s → 0.003%/ms), making the
  // "hidden before / visible at start" stops resolve to the same selector.
  const pctP = (ms: number) => (ms / cycleMs * 100).toFixed(3);

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
    rules.push(`#${m.id} { animation: anim-${m.id} ${cycleStr} var(--ease-out-quart) infinite both; will-change: opacity; }`);
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
        const baseCps = step.cps ?? TYPEWRITER_CPS;
        const accel = step.accel ?? TYPEWRITER_LINE_ACCEL;
        const charCounts = step.lines;
        rules.push(`#${step.id} { clip-path: none; padding-right: 0; }`);
        let lineCursorMs = cursor;
        for (let i = 0; i < charCounts.length; i++) {
          const chars = Math.max(1, charCounts[i]);
          const lineDurMs = (chars / lineCps(baseCps, i, accel)) * 1000;
          const lineId = `${step.id}-line-${i + 1}`;
          // Defer tw-${lineId} keyframe emission — a later `untype` step may
          // extend it with backspace stops. Emitted in the post-loop sweep.
          lineTypeData[lineId] = { chars, lsMs: lineCursorMs, leMs: lineCursorMs + lineDurMs };
          if (step.caret) {
            const lsP = pctP(lineCursorMs);
            const leP = pctP(lineCursorMs + lineDurMs);
            const lsMinus = pctP(Math.max(lineCursorMs - 30, 0));
            const lePlus = pctP(lineCursorMs + lineDurMs + 30);
            rules.push(`@keyframes caret-${lineId} {
  0%, ${lsMinus}% { opacity: 0; left: 0%; }
  ${lsP}% { opacity: 1; left: 0%; }
  ${leP}% { opacity: 1; left: 100%; }
  ${lePlus}%, 100% { opacity: 0; left: 100%; }
}`);
            rules.push(`#caret-${lineId} { animation: caret-${lineId} ${cycleStr} linear infinite both; }`);
          }
          // Beat of silence between lines (product parity). Not applied after
          // the last line — the meta row / next step owns that gap.
          lineCursorMs += lineDurMs;
          if (i < charCounts.length - 1) lineCursorMs += TYPEWRITER_LINE_GAP_MS;
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
        if (step.caret) {
          const lsP = pctP(cursor);
          const leP = pctP(cursor + dur);
          const lsMinus = pctP(Math.max(cursor - 30, 0));
          const lePlus = pctP(cursor + dur + 30);
          rules.push(`@keyframes caret-${step.id} {
  0%, ${lsMinus}% { opacity: 0; left: 0%; }
  ${lsP}% { opacity: 1; left: 0%; }
  ${leP}% { opacity: 1; left: 100%; }
  ${lePlus}%, 100% { opacity: 0; left: 100%; }
}`);
          rules.push(`#caret-${step.id} { animation: caret-${step.id} ${cycleStr} linear infinite both; }`);
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
      const dur = step.duration ? parseMs(step.duration) : USER_POP_MS;
      const endPct = pct(cursor + dur);
      // Opacity gets its own stop so it lands early and the transform still
      // interpolates start → end across the full pop: CSS animates each
      // property between the keyframes that declare it, so omitting transform
      // here leaves the --ease-pop curve on the move untouched.
      const cutPct = pct(cursor + Math.min(USER_OPACITY_CUT_MS, dur));
      const opacityCut = cutPct === startPct ? '' : `\n  ${cutPct}% { opacity: 1; }`;
      rules.push(`@keyframes pop-${step.id} {
  0%, ${startPct}% { opacity: 0; transform: translate3d(0, 20px, 0) scale(0.85); }${opacityCut}
  ${endPct}%, 100% { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
}`);
      rules.push(`#${step.id} { animation: pop-${step.id} ${cycleStr} var(--ease-pop) infinite both; will-change: transform, opacity; }`);
      cursor += dur + parseMs(step.pause || '0s');
    }

    else if (step.type === 'thinking') {
      const fadeIn = parseMs(step.fadeIn || THINKING_FADE_IN_MS);
      const dwell = parseMs(step.duration || THINKING_DWELL_MS);
      const inEnd = pct(cursor + fadeIn);
      // The exit is a hard cut (the widget unmounts the indicator as the reply
      // mounts), so the two stops sit 1ms apart and need the higher-precision
      // pct to stay distinct. Plain ease-out matches the product's fade-in.
      const cutStart = pctP(cursor + dwell);
      const cutEnd = pctP(cursor + dwell + 1);

      // `visibility` rides along with opacity so the indicator leaves the
      // accessibility tree outside its visible window — opacity 0 alone keeps
      // the stale "Thinking" reachable on top of the finished reply, since the
      // element stays mounted for the whole loop. Safe to animate: visibility
      // interpolates discretely, but an interval with either endpoint `visible`
      // stays visible throughout, so the fade-in and the cut are unaffected.
      rules.push(`@keyframes think-${step.id} {
  0%, ${startPct}% { opacity: 0; visibility: hidden; }
  ${inEnd}% { opacity: 1; visibility: visible; }
  ${cutStart}% { opacity: 1; visibility: visible; }
  ${cutEnd}%, 100% { opacity: 0; visibility: hidden; }
}`);
      rules.push(`#${step.id} { animation: think-${step.id} ${cycleStr} ease-out infinite both; will-change: opacity; }`);

      // The reply starts typing at the cut, so the indicator is gone on the
      // frame the first characters appear — never both at once.
      cursor += dwell + parseMs(step.pause || '0s');
    }

    else if (step.type === 'divider') {
      const dur = parseMs(step.duration || '0.54s');
      const endPct = pct(cursor + dur);
      rules.push(`@keyframes fade-${step.id} {
  0%, ${startPct}% { opacity: 0; }
  ${endPct}%, 100% { opacity: 1; }
}`);
      rules.push(`#${step.id} { animation: fade-${step.id} ${cycleStr} var(--ease-out-quart) infinite both; will-change: opacity; }`);
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
      const widgetEase = step.ease || 'var(--ease-out-quart)';
      rules.push(`#${step.id} { animation: show-${step.id} ${cycleStr} ${widgetEase} infinite both; will-change: transform, opacity; }`);

      // Shimmer overlay — radial sweep that fires alongside the widget's
      // entry. Targets a child [data-shimmer] element so the parent's existing
      // transform stays untouched. Used for success/confirmation moments.
      if (step.shimmer) {
        const shimmerStart = pct(cursor);
        const shimmerPeak = pct(cursor + dur * 0.55);
        const shimmerEnd = pct(cursor + dur + parseMs('0.35s'));
        rules.push(`@keyframes shimmer-${step.id} {
  0%, ${shimmerStart}% { opacity: 0; transform: scale(0.4); }
  ${shimmerPeak}% { opacity: 1; transform: scale(1); }
  ${shimmerEnd}%, 100% { opacity: 0; transform: scale(1.7); }
}`);
        rules.push(`#${step.id} [data-shimmer] { animation: shimmer-${step.id} ${cycleStr} var(--ease-travel) infinite both; will-change: transform, opacity; }`);
      }

      // `parallel: true` skips the cursor advance so the next widget runs at
       // the same start time — used to sync overlay+sheet entries.
      if (!step.parallel) {
        cursor += dur + parseMs(step.pause || '0s');
      }
    }

    else if (step.type === 'cursor') {
      const waypoints = step.waypoints;
      const id = step.id;

      // Lazily init aggregate for this cursor id
      if (!cursorData[id]) {
        cursorData[id] = { frames: [], lastX: 0, lastY: 0, initialized: false, parked: false };
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

      // Position via transform: translate3d (S-tier, compositor-only) instead
      // of left/top (D-tier, layout per frame). DemoCursor's static CSS is
      // anchored at top:0; left:0 so the transform is from offsetParent origin.
      const pos = (x: number, y: number, s: number) =>
        `transform: translate3d(${x}px, ${y}px, 0) scale(${s});`;

      if (!data.initialized) {
        const appear = parseMs(step.appear || '0.3s');
        const startX = step.startX ?? ((waypoints[0]?.x ?? 0) + 60);
        const startY = step.startY ?? ((waypoints[0]?.y ?? 0) + 40);
        data.frames.push(`0%, ${pct(c)}% { opacity: 0; ${pos(startX, startY, 1)} }`);
        c += appear;
        data.frames.push(`${pct(c)}% { opacity: 1; ${pos(startX, startY, 1)} }`);
        data.lastX = startX;
        data.lastY = startY;
        data.initialized = true;
      } else if (data.parked) {
        // Previous step parked the cursor at a rest position (opacity 1).
        // No fade-in — start traveling from rest immediately.
        data.frames.push(`${pct(c)}% { opacity: 1; ${pos(data.lastX, data.lastY, 1)} }`);
      } else {
        // Cursor was faded out at end of previous step. Hold hidden at last
        // position, then fade back in for this step.
        data.frames.push(`${pct(c)}% { opacity: 0; ${pos(data.lastX, data.lastY, 1)} }`);
        const appear = parseMs(step.appear || '0.18s');
        c += appear;
        data.frames.push(`${pct(c)}% { opacity: 1; ${pos(data.lastX, data.lastY, 1)} }`);
      }

      let lastMode: 'pointer' | 'text' = 'pointer';
      for (const wp of waypoints) {
        const travel = parseMs(wp.travel || '0.5s');
        const click = parseMs(wp.click || '0.12s');
        const wpPause = parseMs(wp.pause || '0.2s');
        const wx = wp.x ?? 0;
        const wy = wp.y ?? 0;

        c += travel;
        data.frames.push(`${pct(c)}% { opacity: 1; ${pos(wx, wy, 1)} }`);
        // At click moment, instantly swap icon if waypoint specifies a mode.
        const mode = wp.mode || 'pointer';
        const beforePct = pct(Math.max(c - 50, 0));
        cursorIconData[pointerIconId].push({ pct: `${beforePct}%`, opacity: 1 });
        cursorIconData[pointerIconId].push({ pct: `${pct(c)}%`, opacity: mode === 'text' ? 0 : 1 });
        cursorIconData[textIconId].push({ pct: `${beforePct}%`, opacity: 0 });
        cursorIconData[textIconId].push({ pct: `${pct(c)}%`, opacity: mode === 'text' ? 1 : 0 });
        c += click;
        data.frames.push(`${pct(c)}% { opacity: 1; ${pos(wx, wy, 0.85)} }`);

        if (wp.select) {
          // Record select-on. Aggregator emits one keyframe per target after
          // the main loop, allowing later `deselect` steps to release focus.
          if (!selectionData[wp.select]) selectionData[wp.select] = [{ pct: '0%', selected: false }];
          selectionData[wp.select].push({ pct: `${pct(c)}%`, selected: false });
          selectionData[wp.select].push({ pct: `${pct(c + click)}%`, selected: true });

          // Anticipation pulse: target scales 1 → 1.012 → 1 across the click
          // moment. c here is the post-travel/pre-compress timestamp, so the
          // pulse peaks coincident with the cursor's deepest press.
          const pulseStart = Math.max(c - travel * 0.25, 0);
          const pulseEnd = c + click * 2;
          if (!pulseData[wp.select]) pulseData[wp.select] = [{ pct: '0%', scale: 1 }];
          pulseData[wp.select].push({ pct: `${pct(pulseStart)}%`, scale: 1 });
          pulseData[wp.select].push({ pct: `${pct(c)}%`, scale: 1.012 });
          pulseData[wp.select].push({ pct: `${pct(pulseEnd)}%`, scale: 1 });

          // Hover crossfade: fades in over the tail of travel, peaks at
          // arrive (c), crossfades out across the click as `select` takes
          // over. No-op for elements that don't have a [data-hover] overlay.
          if (wp.hover) {
            const hoverIn = parseMs(wp.hover);
            const hoverStart = Math.max(c - hoverIn, 0);
            const hoverEnd = c + click;
            if (!hoverData[wp.select]) hoverData[wp.select] = [{ pct: '0%', opacity: 0 }];
            hoverData[wp.select].push({ pct: `${pct(hoverStart)}%`, opacity: 0 });
            hoverData[wp.select].push({ pct: `${pct(c)}%`, opacity: 1 });
            hoverData[wp.select].push({ pct: `${pct(hoverEnd)}%`, opacity: 0 });
          }
        }

        c += click;
        data.frames.push(`${pct(c)}% { opacity: 1; ${pos(wx, wy, 1)} }`);
        c += wpPause;
        data.lastX = wx;
        data.lastY = wy;
        lastMode = mode;
      }

      if (step.rest) {
        // Park cursor at a rest position on the right side instead of fading
        // out. Cursor stays opacity 1 and the next cursor step travels from
        // here directly — feels more like a real user moving the mouse aside
        // after each click instead of the cursor blinking in and out.

        // Swap icon back to pointer the moment the cursor leaves the click
        // target — otherwise a text-mode click would leave the I-beam visible
        // all the way through the parked-at-rest period. Mirror the click-time
        // swap pattern: hold previous state up to c-50ms, then snap.
        if (lastMode === 'text') {
          const beforePct = pct(Math.max(c - 50, 0));
          cursorIconData[pointerIconId].push({ pct: `${beforePct}%`, opacity: 0 });
          cursorIconData[pointerIconId].push({ pct: `${pct(c)}%`, opacity: 1 });
          cursorIconData[textIconId].push({ pct: `${beforePct}%`, opacity: 1 });
          cursorIconData[textIconId].push({ pct: `${pct(c)}%`, opacity: 0 });
        }

        const restX = step.rest.x ?? 330;
        const restY = step.rest.y ?? data.lastY;
        const restTravel = parseMs(step.rest.travel || '0.5s');
        c += restTravel;
        data.frames.push(`${pct(c)}% { opacity: 1; ${pos(restX, restY, 1)} }`);
        data.lastX = restX;
        data.lastY = restY;
        data.parked = true;
      } else {
        // Fade cursor out at end of step so it disappears while the next thing
        // (typing, attachment slide-in) happens. The next cursor step will fade
        // it back in.
        const disappear = parseMs('0.18s');
        c += disappear;
        data.frames.push(`${pct(c)}% { opacity: 0; ${pos(data.lastX, data.lastY, 1)} }`);
        data.parked = false;
      }

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
      // `parallel: true` keeps the cursor put so the next step starts at the
      // same time — used when the scroll should run concurrently with the
      // arrival of new content (e.g. anchoring a user bubble at the top).
      if (!step.parallel) {
        cursor += dur + parseMs(step.pause || '0s');
      }
    }

    else if (step.type === 'select') {
      const dur = parseMs(step.duration || '0.15s');
      const endPct = pct(cursor + dur);
      if (!selectionData[step.id]) selectionData[step.id] = [{ pct: '0%', selected: false }];
      selectionData[step.id].push({ pct: `${startPct}%`, selected: false });
      selectionData[step.id].push({ pct: `${endPct}%`, selected: true });
      cursor += dur + parseMs(step.pause || '0s');
    }

    else if (step.type === 'shimmer') {
      // Standalone shimmer — emits the same green radial sweep that widget
      // step uses, but on its own keyframe so it can fire independently
      // (e.g. timed against a morph reveal). Doesn't advance the cursor by
      // default — pause if you want subsequent steps to wait.
      const dur = parseMs(step.duration || '0.45s');
      const shimmerStart = pct(cursor);
      const shimmerPeak = pct(cursor + dur * 0.55);
      const shimmerEnd = pct(cursor + dur + parseMs('0.35s'));
      rules.push(`@keyframes shimmer-${step.target} {
  0%, ${shimmerStart}% { opacity: 0; transform: scale(0.4); }
  ${shimmerPeak}% { opacity: 1; transform: scale(1); }
  ${shimmerEnd}%, 100% { opacity: 0; transform: scale(1.7); }
}`);
      rules.push(`#${step.target} [data-shimmer] { animation: shimmer-${step.target} ${cycleStr} var(--ease-travel) infinite both; will-change: transform, opacity; }`);
      cursor += parseMs(step.pause || '0s');
    }

    else if (step.type === 'untype') {
      const dur = parseMs(step.duration || '0.5s');
      const data = lineTypeData[step.target];
      if (data) {
        data.bsMs = cursor;
        data.beMs = cursor + dur;
      } else {
        console.warn(`[timeline] untype target "${step.target}" not in tracked typewriter lines`);
      }
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

      // smoothMode-style coordinated MORPH for state-* targets — both elements
      // meet at scale 0.88 with opposite tilts and a soft blur, so the eye
      // reads it as one shape transforming. Triggered only when `morph: true`
      // is set on the step (forms uses this for state-form → state-success).
      const morphMidPct = pct(cursor + dur * 0.55);
      const morphShowStartPct = pct(cursor + dur * 0.30);

      if (step.morph) {
        if (showInfo) {
          rules.push(`@keyframes show-${step.hide} {
  0%, ${showInfo.startPct}% { opacity: 0; transform: translateY(${showInfo.slideY}) scale(0.99); }
  ${showInfo.endPct}% { opacity: 1; transform: translateY(0) scale(1); }
  ${startPct}% { opacity: 1; transform: scale(1); filter: blur(0); animation-timing-function: cubic-bezier(0.5, 0, 0.75, 0); }
  ${morphMidPct}% { opacity: 0; transform: scale(0.86); filter: blur(1.5px); }
  ${endPct}%, 100% { opacity: 0; transform: scale(0.86); filter: blur(1.5px); }
}`);
        } else {
          rules.push(`@keyframes hide-${step.hide} {
  0%, ${startPct}% { opacity: 1; transform: scale(1); filter: blur(0); animation-timing-function: cubic-bezier(0.5, 0, 0.75, 0); }
  ${morphMidPct}% { opacity: 0; transform: scale(0.86); filter: blur(1.5px); }
  ${endPct}%, 100% { opacity: 0; transform: scale(0.86); filter: blur(1.5px); }
}`);
          rules.push(`#${step.hide} { animation: hide-${step.hide} ${cycleStr} linear infinite both; will-change: transform, opacity, filter; }`);
        }
        rules.push(`@keyframes show-${step.show} {
  0%, ${morphShowStartPct}% { opacity: 0; transform: scale(0.88); filter: blur(1px); animation-timing-function: var(--ease-travel); }
  ${endPct}%, 100% { opacity: 1; transform: scale(1); filter: blur(0); }
}`);
        rules.push(`#${step.show} { animation: show-${step.show} ${cycleStr} linear infinite both; will-change: transform, opacity, filter; }`);
      } else {
        // Legacy plain cross-fade
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
          rules.push(`#${step.hide} { animation: hide-${step.hide} ${cycleStr} var(--ease-out-quart) infinite both; will-change: transform, opacity; }`);
        }

        rules.push(`@keyframes show-${step.show} {
  0%, ${startPct}% { opacity: 0; transform: translateY(8px); }
  ${endPct}%, 100% { opacity: 1; transform: translateY(0); }
}`);
        rules.push(`#${step.show} { animation: show-${step.show} ${cycleStr} var(--ease-out-quart) infinite both; will-change: transform, opacity; }`);
      }
      // `parallel: true` skips the cursor advance so a following step starts
      // at the same time — used when two transitions need to run concurrently
      // (e.g. cross-fading bot-text alongside a card morph).
      if (!step.parallel) {
        cursor += dur + parseMs(step.pause || '0s');
      }
    }

    else if (step.type === 'voicecall') {
      // Voice-call choreography for <CallPanel>. Every number below is the
      // product's, not invented here: the phase lengths are CALL_PHASES from
      // the widget's phone-call surface, and the staggers/durations are
      // VoiceWaveform's SETTLE_*/MORPH_* constants. Colours and geometry come
      // from Figma "Transfer to human" (3962:21805).
      //
      // The source switches React renders per phase; this engine has one
      // cycle-locked keyframe per element, so each dot and each bar gets its
      // whole life emitted as a single keyframe. The observable result is the
      // same, with one deliberate substitution noted at the morph below.
      const connecting = parseMs(step.connecting || '1.4s');
      const settling = parseMs(step.settling || '0.7s');
      const morphing = parseMs(step.morphing || '0.46s');

      const BARS = 7;
      // voice-connect-dot is a 1.4s loop with an i*200ms delay, so a 1.4s
      // `connecting` phase is exactly one sweep of the row — 7 x 200ms. Its
      // 0%,14% / 28%,100% stops become the hold and the fade-back below.
      const DOT_STAGGER = 200;
      const DOT_HOLD = Math.round(connecting * 0.14);
      const DOT_RELEASE = Math.round(connecting * 0.28);
      const SETTLE_STAGGER = 40;
      const SETTLE_DUR = 520;
      const MORPH_STAGGER = 40;
      const MORPH_DUR = 420;
      const CALL_EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';

      const settleStart = cursor + connecting;
      const morphStart = settleStart + settling;

      // Every stop below uses pctP, not pct. This block is built out of 1ms
      // hard cuts, and at pct's one decimal a 1ms gap rounds to the SAME
      // percentage — a duplicate offset does not step, it makes the whole
      // preceding segment ramp to the second value instead. That is what
      // pctP already exists for.
      //
      // Row handoff: the dots row cuts out on the frame the bars row cuts in.
      // A cut, not a cross-fade — the source unmounts one and mounts the
      // other, and at that instant both rows are seven identical 8px black
      // circles, so the swap is invisible.
      rules.push(`@keyframes call-dots-${step.id} {
  0%, ${pctP(morphStart)}% { opacity: 1; }
  ${pctP(morphStart + 1)}%, 100% { opacity: 0; }
}`);
      rules.push(`#${step.id}-dots { animation: call-dots-${step.id} ${cycleStr} linear infinite both; will-change: opacity; }`);
      rules.push(`@keyframes call-bars-${step.id} {
  0%, ${pctP(morphStart)}% { opacity: 0; }
  ${pctP(morphStart + 1)}%, 100% { opacity: 1; }
}`);
      rules.push(`#${step.id}-bars { animation: call-bars-${step.id} ${cycleStr} linear infinite both; will-change: opacity; }`);

      for (let i = 0; i < BARS; i++) {
        // Dot i: idle grey, hard-cut to black when the sweep reaches it, fade
        // back to grey, then settle to black for good. The hard cut is the
        // source's — voice-connect-dot starts AT brand with no fill-back, so
        // the colour appears instantly and only the release interpolates.
        const on = cursor + i * DOT_STAGGER;
        const settleIn = settleStart + i * SETTLE_STAGGER;
        rules.push(`@keyframes call-dot-${step.id}-${i} {
  0%, ${pctP(on)}% { background-color: var(--call-dot-idle); }
  ${pctP(on + 1)}%, ${pctP(on + DOT_HOLD)}% { background-color: var(--call-dot-live); }
  ${pctP(on + DOT_RELEASE)}%, ${pctP(settleIn)}% { background-color: var(--call-dot-idle); animation-timing-function: ${CALL_EASE}; }
  ${pctP(settleIn + SETTLE_DUR * 0.55)}% { background-color: color-mix(in srgb, var(--call-dot-live) 45%, var(--call-dot-idle)); }
  ${pctP(settleIn + SETTLE_DUR)}%, 100% { background-color: var(--call-dot-live); }
}`);
        rules.push(`#${step.id}-dots [data-dot]:nth-child(${i + 1}) { animation: call-dot-${step.id}-${i} ${cycleStr} linear infinite both; will-change: background-color; }`);

        // Bar i: holds at dot size, grows on its stagger, then hands off to the
        // ambient `voice-bar` oscillation at FULL amplitude.
        //
        // --voice-amp steps 0 -> 1, it does not ramp. The source carries a
        // `transition: --voice-amp` that reads like a 660ms ease-in, but that
        // transition is inert (--voice-amp is not registered there), so what
        // actually ships snaps to full amplitude the moment the morph ends.
        // Copy the shipped behaviour: a ramp leaves the wave nearly flat for
        // over a second, which on a looping demo is most of its time on screen.
        //
        // SUBSTITUTION: the source grows an UNCLIPPED bar 4% -> ratio*22%,
        // because during `morphing` voice-bar-grow occupies its single
        // animation slot and no clip-path applies. Here voice-bar rides along
        // in the same declaration and never stops, so the bar is clipped
        // throughout and the grow is expressed in box height instead:
        // amp 0 pins the clip at a constant inset(22.5%), i.e. 55% of the box,
        // so growing the box to ratio*40% shows ratio*22% — the source's exact
        // end state — and starting at 7.2727% (8px / 0.55 of the 200px orb)
        // shows the 8px circle the dot handed over. Same pixels, one animation.
        const morphIn = morphStart + i * MORPH_STAGGER;
        rules.push(`@keyframes call-bar-${step.id}-${i} {
  0%, ${pctP(morphIn)}% { height: 7.2727%; --voice-amp: 0; animation-timing-function: ${CALL_EASE}; }
  ${pctP(morphIn + MORPH_DUR)}% { height: calc(var(--bar-ratio) * 40%); --voice-amp: 0; }
  ${pctP(morphIn + MORPH_DUR + 1)}%, 100% { height: calc(var(--bar-ratio) * 40%); --voice-amp: 1; }
}`);
        // Both animations must live in ONE declaration: this selector outranks
        // CallPanel.module.css, so a separate rule there would be overridden
        // rather than merged, and the waveform would never oscillate.
        rules.push(`#${step.id}-bars [data-bar]:nth-child(${i + 1}) { animation: call-bar-${step.id}-${i} ${cycleStr} linear infinite both, voice-bar 1.6s linear ${(-i * 0.23).toFixed(2)}s infinite; will-change: height, clip-path; }`);
      }

      // Caption: "Calling customer support..." fades out across `settling` as
      // "Talking to Alex James" fades in. Opacity only — the two sit in the
      // same 20px slot, so any translate would read as drift.
      rules.push(`@keyframes call-cap-out-${step.id} {
  0%, ${pctP(settleStart)}% { opacity: 1; }
  ${pctP(morphStart)}%, 100% { opacity: 0; }
}`);
      rules.push(`#${step.id}-cap-connecting { animation: call-cap-out-${step.id} ${cycleStr} linear infinite both; will-change: opacity; }`);
      rules.push(`@keyframes call-cap-in-${step.id} {
  0%, ${pctP(settleStart)}% { opacity: 0; }
  ${pctP(morphStart)}%, 100% { opacity: 1; }
}`);
      rules.push(`#${step.id}-cap-talking { animation: call-cap-in-${step.id} ${cycleStr} linear infinite both; will-change: opacity; }`);

      cursor += connecting + settling + morphing + parseMs(step.pause || '0s');
    }
  }

  // Emit aggregated cursor keyframes. Cursor steps end with opacity 0 (faded
  // out), so the 100% stop matches that — no jump on cycle wrap. EXCEPTION:
  // if the last step left the cursor parked (rest position, opacity 1), hold
  // that opacity until 96% then quick-fade to 0 in the final 4% of the cycle.
  // Without the hold, the global cubic-bezier(0.4, 0, 0.2, 1) easing front-
  // loads the opacity change between the last waypoint and 100%, making the
  // cursor visibly drop right after the final click.
  for (const [id, data] of Object.entries(cursorData)) {
    if (!data.initialized) continue;
    if (data.parked) {
      data.frames.push(`96% { opacity: 1; transform: translate3d(${data.lastX}px, ${data.lastY}px, 0) scale(1); }`);
    }
    data.frames.push(`100% { opacity: 0; transform: translate3d(${data.lastX}px, ${data.lastY}px, 0) scale(1); }`);
    rules.push(`@keyframes move-${id} {\n  ${data.frames.join('\n  ')}\n}`);
    // cubic-bezier(0.4, 0, 0.2, 1) — Material Design standard ease. Gentle
    // and symmetric, no overshoot, no steep deceleration tail. Closer to
    // natural mouse motion than the springy ease-travel or the snappier
    // ease-scroll. Applied to every segment of the cursor keyframe so the
    // click compression (scale 1 → 0.85 → 1) also reads smooth.
    rules.push(`#${id} { animation: move-${id} ${cycleStr} cubic-bezier(0.4, 0, 0.2, 1) infinite both; will-change: transform, opacity; }`);
  }

  // Emit aggregated scroll keyframes
  for (const [id, data] of Object.entries(scrollData)) {
    data.stops.push({ pct: '100%', ty: data.lastY });
    const frameStrs = data.stops.map(s => `${s.pct} { transform: translateY(${s.ty}px); }`);
    rules.push(`@keyframes scroll-${id} {\n  ${frameStrs.join('\n  ')}\n}`);
    rules.push(`#${id} { animation: scroll-${id} ${cycleStr} var(--ease-scroll) infinite both; will-change: transform; }`);
  }

  // Emit aggregated cursor-icon keyframes — pointer ↔ text I-beam swap.
  for (const [id, stops] of Object.entries(cursorIconData)) {
    const last = stops[stops.length - 1];
    stops.push({ pct: '100%', opacity: last.opacity });
    const frameStrs = stops.map(s => `${s.pct} { opacity: ${s.opacity}; }`);
    rules.push(`@keyframes ico-${id} {\n  ${frameStrs.join('\n  ')}\n}`);
    rules.push(`#${id} { animation: ico-${id} ${cycleStr} linear infinite both; }`);
  }

  // Emit aggregated anticipation-pulse keyframes — target scales 1 → 1.012 → 1
  // around each click. Composite-only (transform).
  for (const [id, stops] of Object.entries(pulseData)) {
    const last = stops[stops.length - 1];
    stops.push({ pct: '100%', scale: last.scale });
    const frameStrs = stops.map(s => `${s.pct} { transform: scale(${s.scale}); }`);
    rules.push(`@keyframes pulse-${id} {\n  ${frameStrs.join('\n  ')}\n}`);
    rules.push(`#${id} { animation: pulse-${id} ${cycleStr} var(--ease-out-quart) infinite both; will-change: transform; }`);
  }

  // Emit aggregated selection (focus ring) keyframes — composite-only opacity
  // tween on a sibling [data-ring] overlay (the parent's natural border shows
  // through when the overlay is at opacity 0). Replaces previous box-shadow
  // animation on the parent (paint-tier).
  //
  // `[data-label-default]` and `[data-label-selected]` are paired overlays for
  // a label swap (e.g. "Select" → "Selected"): the default fades out as the
  // selected fades in, in sync with the ring. Targets without those overlays
  // get no-op rules.
  for (const [id, stops] of Object.entries(selectionData)) {
    const last = stops[stops.length - 1];
    stops.push({ pct: '100%', selected: last.selected });
    const frameStrs = stops.map(s => `${s.pct} { opacity: ${s.selected ? 1 : 0}; }`);
    rules.push(`@keyframes sel-${id} {\n  ${frameStrs.join('\n  ')}\n}`);
    rules.push(`#${id} [data-ring] { animation: sel-${id} ${cycleStr} linear infinite both; will-change: opacity; }`);
    rules.push(`#${id} [data-label-selected] { animation: sel-${id} ${cycleStr} linear infinite both; will-change: opacity; }`);
    const invFrameStrs = stops.map(s => `${s.pct} { opacity: ${s.selected ? 0 : 1}; }`);
    rules.push(`@keyframes sel-inv-${id} {\n  ${invFrameStrs.join('\n  ')}\n}`);
    rules.push(`#${id} [data-label-default] { animation: sel-inv-${id} ${cycleStr} linear infinite both; will-change: opacity; }`);
  }

  // Emit aggregated hover-crossfade keyframes. Bg overlay opacity tween on
  // [data-hover]; sibling [data-hover-text] gets a `color` tween between
  // `--hover-text-idle` and `--hover-text-peak` (defined on the target
  // component). Targets without those CSS vars fall through to `inherit`,
  // leaving the label unchanged.
  for (const [id, stops] of Object.entries(hoverData)) {
    stops.push({ pct: '100%', opacity: 0 });
    const opStrs = stops.map(s => `${s.pct} { opacity: ${s.opacity}; }`);
    rules.push(`@keyframes hov-${id} {\n  ${opStrs.join('\n  ')}\n}`);
    rules.push(`#${id} [data-hover] { animation: hov-${id} ${cycleStr} linear infinite both; will-change: opacity; }`);
    const colorStrs = stops.map(s =>
      `${s.pct} { color: var(${s.opacity === 1 ? '--hover-text-peak' : '--hover-text-idle'}, inherit); }`
    );
    rules.push(`@keyframes hov-text-${id} {\n  ${colorStrs.join('\n  ')}\n}`);
    rules.push(`#${id} [data-hover-text] { animation: hov-text-${id} ${cycleStr} linear infinite both; }`);
  }

  // Emit deferred typewriter line keyframes. With an `untype` step the same
  // keyframe carries both type-in (steps→reveal) and type-out (steps→hide)
  // stops, so a single animation owns clip-path end-to-end.
  for (const [lineId, d] of Object.entries(lineTypeData)) {
    const ls = pct(d.lsMs);
    const le = pct(d.leMs);
    const stops: string[] = [
      `0% { clip-path: inset(0 100% 0 0); animation-timing-function: linear; }`,
      `${ls}% { clip-path: inset(0 100% 0 0); animation-timing-function: steps(${d.chars}, end); }`,
    ];
    if (d.bsMs !== undefined && d.beMs !== undefined) {
      const bs = pct(d.bsMs);
      const be = pct(d.beMs);
      stops.push(`${le}% { clip-path: inset(0 0% 0 0); animation-timing-function: linear; }`);
      stops.push(`${bs}% { clip-path: inset(0 0% 0 0); animation-timing-function: steps(${d.chars}, end); }`);
      stops.push(`${be}%, 100% { clip-path: inset(0 100% 0 0); }`);
    } else {
      stops.push(`${le}%, 100% { clip-path: inset(0 0% 0 0); }`);
    }
    rules.push(`@keyframes tw-${lineId} {\n  ${stops.join('\n  ')}\n}`);
    rules.push(`#${lineId} { animation: tw-${lineId} ${cycleStr} infinite both; }`);
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

  // Post-pass: merge multiple `<selector> { animation: ... }` rules into a
  // single comma-separated declaration so animations on the same element run
  // side-by-side (e.g. pulse-btn-metcon + hide-btn-metcon both apply). CSS
  // shorthand replacement would otherwise let the LAST `animation:` rule
  // override prior ones, leaving the click target without its hide/pulse.
  // Only single-line `<sel> { animation: V; [will-change: W;] }` rules are
  // matched — keyframes blocks and other declarations pass through untouched.
  const animRulePattern = /^\s*([^{}\n]+?)\s*\{\s*animation:\s*([^;]+);\s*(?:will-change:\s*([^;]+);\s*)?\}\s*$/;
  type AnimEntry = { animations: string[]; willChange: Set<string> };
  const animBySelector = new Map<string, AnimEntry>();
  const merged: string[] = [];
  for (const rule of rules) {
    const m = rule.match(animRulePattern);
    if (m) {
      const selector = m[1].trim();
      const animValue = m[2].trim();
      const wc = m[3]?.trim();
      if (!animBySelector.has(selector)) {
        animBySelector.set(selector, { animations: [], willChange: new Set() });
        merged.push(` ANIM:${selector}`);
      }
      const entry = animBySelector.get(selector)!;
      entry.animations.push(animValue);
      if (wc) wc.split(',').map(s => s.trim()).forEach(s => entry.willChange.add(s));
    } else {
      merged.push(rule);
    }
  }
  for (let i = 0; i < merged.length; i++) {
    if (merged[i].startsWith(' ANIM:')) {
      const selector = merged[i].slice(' ANIM:'.length);
      const entry = animBySelector.get(selector)!;
      const wcStr = entry.willChange.size > 0 ? ` will-change: ${Array.from(entry.willChange).join(', ')};` : '';
      merged[i] = `${selector} { animation: ${entry.animations.join(', ')};${wcStr} }`;
    }
  }

  return merged.join('\n');
}
