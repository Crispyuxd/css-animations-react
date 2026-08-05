import type { TimelineConfig } from './types';
import { parseMs } from './parse-ms';
import { CALL_BAR_RATIOS } from './call-waveform';

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

  // Cycle-end fade window. stackFadeCycle at the bottom of this file owns it,
  // but two things inside the step loop have to line up with it: a `surface`
  // morph's exit and a `voicecall`'s outro. Computed here so all three read the
  // same numbers instead of re-deriving them.
  const CYCLE_TAIL_MS = 900;
  const fadeOutStartMs = cycleMs - outroMs - CYCLE_TAIL_MS;
  const fadeOutEndMs = cycleMs - CYCLE_TAIL_MS;

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
      //
      // `surface: true` narrows that to a swap of the WHOLE card body
      // (transfer-to-human's state-chat → state-call) rather than a card living
      // inside the message stack. Three things change, and all three are gated
      // because the five in-stack morphs (calendar, forms, leads, stripe,
      // shopify) are approved as they stand:
      //
      //   1. The incoming half cannot ride var(--ease-travel). That curve is a
      //      spring — linear(0, 0.3892, 0.921, 1.1515, …) — and linear() spaces
      //      its stops evenly, so it is at 0.921 by 12.5% of its segment. On the
      //      default 0.30 start that is 44ms of a 350ms fade: the surface does
      //      not fade in, it cuts in, over a chat that is still ~30% there. A
      //      spring on opacity always reads as a snap. Material standard is
      //      monotone and symmetric, so opacity tracks the crossover instead.
      //   2. The halves have to overlap properly. The incoming starts at 0.10
      //      instead of 0.30 and the outgoing plunge lands at 0.65 instead of
      //      0.55, so the call surface is already ~2/3 present when the chat
      //      finishes leaving and there is no near-empty frame between them. The
      //      outgoing curve is deliberately NOT softened: its steep ease-in is
      //      what stops high-contrast transcript text ghosting through the orb.
      //   3. A surface swap is the last thing on screen at the end of the cycle,
      //      so this one step owns both the exit and the re-entry — see the
      //      morph-out stops on `show-` and the reveal stops on `hide-` below.
      const SURFACE_SHOW_AT = 0.10;
      const SURFACE_HIDE_AT = 0.65;
      const morphMidPct = pct(cursor + dur * (step.surface ? SURFACE_HIDE_AT : 0.55));
      const morphShowStartPct = pct(cursor + dur * (step.surface ? SURFACE_SHOW_AT : 0.30));
      const morphShowEase = step.surface ? 'cubic-bezier(0.4, 0, 0.2, 1)' : 'var(--ease-travel)';

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
          // A surface morph hides the element that owns the chat input, and the
          // input sits outside .messagesStack, so the cycle's intro fade does
          // not cover it. Left alone this keyframe holds opacity 0 to 100% and
          // then snaps back to 1 at 0%, popping the input bar in one frame ahead
          // of the messages above it. Fading the surface up across introHold
          // puts it on the same entrance as the stack. (The messages inside it
          // then carry both fades, which over a matched window is a mild ease-in
          // on an already-fading element — not a second visible fade.)
          const canReveal = step.surface && introMs < cursor;
          const hideHead = canReveal
            ? `0% { opacity: 0; transform: scale(1); filter: blur(0); }
  ${pct(introMs)}% { opacity: 1; transform: scale(1); filter: blur(0); }
  ${startPct}%`
            : `0%, ${startPct}%`;
          rules.push(`@keyframes hide-${step.hide} {
  ${hideHead} { opacity: 1; transform: scale(1); filter: blur(0); animation-timing-function: cubic-bezier(0.5, 0, 0.75, 0); }
  ${morphMidPct}% { opacity: 0; transform: scale(0.86); filter: blur(1.5px); }
  ${endPct}%, 100% { opacity: 0; transform: scale(0.86); filter: blur(1.5px); }
}`);
          rules.push(`#${step.hide} { animation: hide-${step.hide} ${cycleStr} linear infinite both; will-change: transform, opacity, filter; }`);
        }
        // A surface swap has nothing following it, so `show-` owns BOTH ends of
        // its life: opacity, transform and filter, in and out, from this one
        // keyframe. That single ownership is the point — it is the only way the
        // exit can be the entry's mirror rather than merely resemble it.
        //
        // A surface must therefore NOT carry the `messagesStack` cycle-fade hook.
        // That hook fades linearly, and on the inner panel rather than on the
        // wrapper, so a surface wearing it gets a flat linear dim on the way out
        // against an eased fade on the way in — two different fades on the same
        // element, which is exactly what reads as the exit being a different move.
        //
        // The surface RISES in and DROPS out, so the two ends of its life read as
        // one gesture. A shift also gives the eye something to track, which a
        // pure opacity fade of a plain block does not — see the per-element
        // arrival below for the other half of that. The 0.98 keeps a whisper of
        // the morph's scale coupling with the outgoing chat (which still goes to
        // 0.86) without competing with the shift for the read.
        //
        // The exit is the ENTRY MIRRORED, deliberately down to the numbers: same
        // travel, same 0.98, same 1px blur, same curve, and via the demo's
        // `outroFade` the same window length. It was its own gesture before —
        // 20px, a 1.5px blur and cubic-bezier(0.4, 0, 1, 1) with no deceleration
        // — and a harder, longer exit than the arrival it closes reads as a
        // different move rather than the same one running backwards.
        //
        // Every stop in the surface path carries the same two-function transform
        // list. Mixing `scale(1)` with `translateY(14px)` across a segment makes
        // Chrome fall back to matrix interpolation; matching lists keep it
        // per-component. translateY(0) is a no-op, so the non-surface path still
        // emits a bare `scale()` exactly as before.
        const SURFACE_SHIFT = '14px';
        const SURFACE_SETTLE = '0.98';
        const SURFACE_BLUR = '1px';
        const tf = (y: string, s: string) =>
          step.surface ? `translateY(${y}) scale(${s})` : `scale(${s})`;
        const surfaceExit = step.surface
          ? `
  ${pct(fadeOutStartMs)}% { opacity: 1; transform: ${tf('0', '1')}; filter: blur(0); animation-timing-function: ${morphShowEase}; }
  ${pct(fadeOutEndMs)}%, 100% { opacity: 0; transform: ${tf(SURFACE_SHIFT, SURFACE_SETTLE)}; filter: blur(${SURFACE_BLUR}); }`
          : '';
        const enterTf = step.surface ? tf(SURFACE_SHIFT, SURFACE_SETTLE) : 'scale(0.88)';
        rules.push(`@keyframes show-${step.show} {
  0%, ${morphShowStartPct}% { opacity: 0; transform: ${enterTf}; filter: blur(1px); animation-timing-function: ${morphShowEase}; }
  ${endPct}%${step.surface ? '' : ', 100%'} { opacity: 1; transform: ${tf('0', '1')}; filter: blur(0); }${surfaceExit}
}`);
        rules.push(`#${step.show} { animation: show-${step.show} ${cycleStr} linear infinite both; will-change: transform, opacity, filter; }`);

        // Per-element arrival. Fading a 668px surface as one plane reads as a
        // jump however clean the curve is, because nothing inside it moves
        // independently — there is no detail to follow, so the whole thing just
        // appears. The surface carries the movement; the groups tagged
        // [data-enter] arrive behind it on a stagger, so the card comes in and
        // then populates.
        //
        // Each group rises 6px as it fades, rather than fading alone. Filled,
        // high-contrast elements — the mic and the red end-call pill — read as
        // popping when a bare opacity change is all that happens to them; the
        // same reason UserMessage's entrance is carried by its transform and cuts
        // its opacity almost immediately. A little movement makes them arrive.
        //
        // Timing is explicit per hook, NOT a uniform ladder, because a uniform
        // one puts something last by construction and whatever lands last after
        // the rest has settled is the thing that reads as popping. The controls
        // are chrome — a mic and an end-call button that any call screen simply
        // has — so they come in WITH the card. The caption is the content, so it
        // lands last, and it is text, which takes a fade cleanly.
        //
        // Curves here are Material standard, which is NOT a gentle start: it is at
        // ~0.54 by 37% of its duration, measurably no softer than the ease-out it
        // replaced. Softening the curve was tried and it is not what fixes a pop —
        // arrival ORDER is.
        //
        // A hook can only go on an element with no other transform or opacity
        // animation of its own, because `#state-call [data-enter="n"]` (0,1,1,0)
        // outranks a bare id and `animation` overrides wholesale. That rules out
        // the orb (the voicecall step's collapse) and the two captions (their own
        // swap) — hence the caption SLOT, not the captions.
        // The groups leave in the mirror of the order they arrived in: whatever
        // landed last goes first. `out` is the fraction of the cycle-end window a
        // group takes to clear, and it is OPTIONAL — omitting it means the group
        // has no exit of its own and simply rides the cycle fade out with the
        // surface, which is what the chrome should do.
        //
        // The chrome must not opt in. Its own fade would multiply with
        // stackFadeCycle's, and two ramps to zero over one window is a square:
        // measured, the controls were at 0.24 when the surface had covered 8 of
        // its 14px, so the card was visibly leaving without them. Only the
        // caption — which arrives last, so departs first — earns an exit.
        if (step.surface) {
          const ENTER_SHIFT = 6;
          const ENTER: Array<{ at: number; dur: number; out?: number }> = [
            { at: 0.10, dur: 420 },            // 1 — controls: in with the surface, out with it too
            { at: 0.45, dur: 300, out: 0.60 }, // 2 — caption slot: in last, out first
          ];
          const outWindow = fadeOutEndMs - fadeOutStartMs;
          ENTER.forEach((e, idx) => {
            const enterStart = cursor + dur * e.at;
            const exit = e.out === undefined
              ? ''
              : `
  ${pct(fadeOutStartMs)}% { opacity: 1; transform: translateY(0); }
  ${pct(fadeOutStartMs + outWindow * e.out)}%, 100% { opacity: 0; transform: translateY(${ENTER_SHIFT}px); }`;
            rules.push(`@keyframes enter-${step.show}-${idx + 1} {
  0%, ${pct(enterStart)}% { opacity: 0; transform: translateY(${ENTER_SHIFT}px); }
  ${pct(enterStart + e.dur)}%${exit ? '' : ', 100%'} { opacity: 1; transform: translateY(0); }${exit}
}`);
            rules.push(`#${step.show} [data-enter="${idx + 1}"] { animation: enter-${step.show}-${idx + 1} ${cycleStr} cubic-bezier(0.4, 0, 0.2, 1) infinite both; will-change: opacity, transform; }`);
          });
        }
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

      // Shared with <CallPanel> so the two cannot disagree on the count — the
      // per-unit rules below are addressed by :nth-child.
      const BARS = CALL_BAR_RATIOS.length;
      // voice-connect-dot is a 1.4s loop with an i*200ms delay, so the source's
      // 1.4s `connecting` phase is exactly one sweep of the row: 7 x 200ms.
      // Derived rather than hardcoded to 200 so that identity holds if a demo
      // retimes `connecting` — one sweep, whatever the phase length. (At the
      // default this is 1400/7 = 200 exactly, so output is unchanged.) A fixed
      // 200 would also emit out-of-order stops for a shorter phase, since a dot
      // could then light after its own settle stop.
      const DOT_STAGGER = connecting / BARS;
      const DOT_HOLD = Math.round(connecting * 0.14);
      const DOT_RELEASE = Math.round(connecting * 0.28);
      const SETTLE_STAGGER = 40;
      const SETTLE_DUR = 520;
      const MORPH_STAGGER = 40;
      const MORPH_DUR = 420;
      const CALL_EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';

      // The resting oscillation, identical to the product's: clip-path inset
      // sweeping 22.5% -> 0 -> 22.5% over a 1.6s linear loop, one stop every
      // 200ms (the source's 12.5% keyframe offsets), with each bar 230ms ahead
      // of the one before it (the source's `animation-delay: -i * 0.23s`) so
      // the wave travels along the row instead of pulsing in unison.
      //
      // Emitted as literal insets inside each bar's own cycle-locked keyframe,
      // NOT as a second `voice-bar` animation whose amplitude is gated by an
      // animated --voice-amp custom property. That is how the source does it,
      // and it cannot work here: when a keyframe's calc() reads a custom
      // property that another animation ON THE SAME ELEMENT is animating,
      // Chrome substitutes it once and never re-resolves it. The substitution
      // landed while --voice-amp was still 0 (its pre-morph value), which
      // collapses every stop of the wave to inset(22.5%) — a constant. Five of
      // the seven bars sat frozen at 55% height for the whole cycle, and only
      // the two that happened to catch an unrelated style invalidation moved.
      const WAVE_PERIOD = 1600;
      const WAVE_STEP = WAVE_PERIOD / 8;
      const WAVE_STAGGER = 230;
      // 22.5% x (1 - amp * k) at amp 1, for the source's k of 0, 0.146, 0.5,
      // 0.854, 1 — one full triangle, so index 0 is both 0% and 100%.
      const WAVE_INSETS = [22.5, 19.215, 11.25, 3.285, 0, 3.285, 11.25, 19.215];
      const clipAt = (v: number) => `inset(${v}% 0 ${v}% 0 round 9999px)`;
      const WAVE_REST = clipAt(WAVE_INSETS[0]);
      // Interpolated, not snapped to the grid: a bar's wave starts 1ms after
      // its own grow, which is mid-segment, and it has to pick the triangle up
      // exactly where it already is or the shape kinks on the first stop.
      //
      // `ampF` scales the swing towards WAVE_INSETS[0], which IS rest, so
      // ampF 1 is the identity and ampF 0 is a still bar. It exists for the
      // outro below; the ampF === 1 short-circuit keeps an outro-less demo
      // emitting byte-identical insets rather than round-tripping them through
      // a float subtraction.
      const waveClip = (t: number, ampF = 1) => {
        const k = ((t % WAVE_PERIOD) + WAVE_PERIOD) % WAVE_PERIOD / WAVE_STEP;
        const i0 = Math.floor(k);
        const a = WAVE_INSETS[i0];
        const b = WAVE_INSETS[(i0 + 1) % WAVE_INSETS.length];
        const raw = a + (b - a) * (k - i0);
        const damped = ampF === 1 ? raw : WAVE_INSETS[0] - (WAVE_INSETS[0] - raw) * ampF;
        return clipAt(Number(damped.toFixed(3)));
      };

      // Looping-demo outro. There is nothing to port here: the product's call
      // surface runs its waveform until the user hangs up, so on a loop the wave
      // is simply oscillating at full amplitude when the cycle-end fade takes
      // it, and the demo reads as cut off rather than finished. `outro` eases the
      // amplitude to rest over the window that ENDS at the fade start, so the
      // wave settles and the surface then morphs away from a still row. Opt-in:
      // omit it and the raw product behaviour is unchanged.
      //
      // Half-cosine rather than linear — flat at both ends, so the amplitude
      // neither kinks when the damping starts nor lands hard on rest. Wall-clock
      // t, not the bar's local phase, so all seven settle together, each from
      // wherever its own phase has it.
      const outro = parseMs(step.outro || 0);
      const outroStart = fadeOutStartMs - outro;
      const amp = (t: number) => {
        if (outro <= 0 || t <= outroStart) return 1;
        if (t >= fadeOutStartMs) return 0;
        return 0.5 * (1 + Math.cos(Math.PI * ((t - outroStart) / outro)));
      };

      // No orb collapse here. There WAS one — the orb contracting to 0.86 as the
      // surface left, as the visible "call ended" beat. It came out because the
      // surface exit is the entrance mirrored, and the entrance has no orb
      // movement to mirror: anything extra on the way out is, by definition, the
      // exit being a different gesture. The hang-up now reads from the direction
      // alone — the surface rises in and drops out.
      //
      // If it comes back, it belongs on `#${step.id}-orb`, gated on `outro`, and
      // spanning fadeOutStartMs -> fadeOutEndMs so it resolves with the surface
      // instead of ahead of it. Note the orb cannot also carry a `data-enter`
      // hook: that selector outranks a bare id and `animation` overrides
      // wholesale, so the hook silently replaces the collapse.

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

        // Bar i: holds at dot size, grows on its stagger, then oscillates for
        // the rest of the cycle. One keyframe owns all three, because the wave
        // and the grow both write clip-path/height and a second animation
        // would simply override the first.
        //
        // SUBSTITUTION: the source grows an UNCLIPPED bar 4% -> ratio*22%,
        // because during `morphing` voice-bar-grow occupies its single
        // animation slot and no clip-path applies. Here the grow is clipped by
        // the same keyframe that carries the wave, so it is expressed in box
        // height instead: a constant inset(22.5%) shows 55% of the box, so
        // growing the box to ratio*40% shows ratio*22% — the source's exact end
        // state — and starting at 7.2727% (8px / 0.55 of the 200px orb) shows
        // the 8px circle the dot handed over. Same pixels, one animation.
        //
        // The wave used to hard-cut in 1ms after the grow, on the grounds that
        // the source's `transition: --voice-amp` is inert (--voice-amp is not
        // registered there) so amplitude snaps in the shipped widget. It does —
        // but the phase the cut lands on is arbitrary, so the bar finishes a
        // smooth 420ms grow, sits at the trough, then jumps straight to a
        // mid-wave height. That jump is what reads as the wave sticking before it
        // starts moving.
        //
        // So: amplitude eases up from the trough over WAVE_IN_MS instead. NOT the
        // source's 660ms — that was tried and it leaves the wave nearly flat for
        // most of its time on screen. 180ms is ~11% of one period, so the swing
        // is at full size almost immediately; it only removes the discontinuity.
        // Starting at the bar's own morphEnd means each bar picks up motion as it
        // finishes growing, 40ms apart, so the wave builds along the row.
        const WAVE_IN_MS = 180;
        const WAVE_IN_STEP = 45;
        const morphIn = morphStart + i * MORPH_STAGGER;
        const morphEnd = morphIn + MORPH_DUR;
        const full = 'calc(var(--bar-ratio) * 40%)';
        // Wall-clock -> this bar's position in the wave. Ahead, not behind:
        // the source's delay is negative.
        const local = (t: number) => t + i * WAVE_STAGGER;
        // Half-cosine, same shape as the outro: flat at both ends, so it leaves
        // the trough without a kink and reaches full swing without a snap. The
        // outro's damp is the ceiling, which only matters if a demo ever set an
        // outro long enough to overlap the ramp.
        const ampAt = (t: number) => {
          const rampIn =
            t <= morphEnd ? 0
            : t >= morphEnd + WAVE_IN_MS ? 1
            : 0.5 * (1 - Math.cos(Math.PI * ((t - morphEnd) / WAVE_IN_MS)));
          return Math.min(rampIn, amp(t));
        };
        const bar = [
          `0%, ${pctP(morphIn)}% { height: 7.2727%; clip-path: ${WAVE_REST}; animation-timing-function: ${CALL_EASE}; }`,
          `${pctP(morphEnd)}% { height: ${full}; clip-path: ${WAVE_REST}; }`,
        ];
        // The ramp is sampled finer than the 200ms wave grid — at 200ms a 180ms
        // ease-in would get one stop and interpolate straight through it.
        for (let t = morphEnd + WAVE_IN_STEP; t < morphEnd + WAVE_IN_MS; t += WAVE_IN_STEP) {
          bar.push(`${pctP(t)}% { clip-path: ${waveClip(local(t), ampAt(t))}; }`);
        }
        // Then one stop per 200ms on this bar's own grid, starting at the first
        // grid point after the ramp, so no two stops can round to the same pctP
        // and flatten the segment between them.
        const firstGrid =
          (Math.floor(local(morphEnd + WAVE_IN_MS) / WAVE_STEP) + 1) * WAVE_STEP - i * WAVE_STAGGER;
        for (let t = firstGrid; t < cycleMs; t += WAVE_STEP) {
          bar.push(`${pctP(t)}% { clip-path: ${waveClip(local(t), ampAt(t))}; }`);
          // Past the fade start every stop is rest, so stop emitting them and
          // let the 100% stop below hold it. Purely to keep ~8 identical stops
          // per bar out of the sheet — the held value is the same either way.
          if (outro > 0 && t >= fadeOutStartMs) break;
        }
        // With an outro the wrap is seamless: amp is 0 from the fade start on, so
        // 100% already sits at WAVE_REST. Without one this is a jump back to
        // rest, unseen because the panel is faded out by then.
        bar.push(`100% { clip-path: ${waveClip(local(cycleMs), ampAt(cycleMs))}; }`);
        rules.push(`@keyframes call-bar-${step.id}-${i} {\n  ${bar.join('\n  ')}\n}`);
        rules.push(`#${step.id}-bars [data-bar]:nth-child(${i + 1}) { animation: call-bar-${step.id}-${i} ${cycleStr} linear infinite both; will-change: height, clip-path; }`);
      }

      // Caption: "Calling customer support..." leaves and "Talking to Alex
      // James" arrives. Opacity only — the two sit in the same 20px slot, so any
      // translate would read as drift.
      //
      // SEQUENTIAL, not a cross-fade. Both captions are absolutely stacked in
      // that one slot, centred, and different widths (the talking line carries a
      // UserCircleIcon), so running both across the same settleStart → morphStart
      // window puts two centred strings on top of each other for the whole 700ms
      // and the slot reads as garbled text. Out over the first 40%, an empty beat
      // of 20%, then in over the last 40%: nothing ever overlaps anything.
      //
      // This is also closer to the source than the cross-fade was — the widget
      // switches renders per phase, so it unmounts one caption and mounts the
      // other with no shared frame at all.
      const capOutEnd = settleStart + Math.round(settling * 0.40);
      const capInStart = settleStart + Math.round(settling * 0.60);
      rules.push(`@keyframes call-cap-out-${step.id} {
  0%, ${pctP(settleStart)}% { opacity: 1; }
  ${pctP(capOutEnd)}%, 100% { opacity: 0; }
}`);
      rules.push(`#${step.id}-cap-connecting { animation: call-cap-out-${step.id} ${cycleStr} linear infinite both; will-change: opacity; }`);
      rules.push(`@keyframes call-cap-in-${step.id} {
  0%, ${pctP(capInStart)}% { opacity: 0; }
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
  const fadeOutStart = pct(fadeOutStartMs);
  const fadeOutEnd = pct(fadeOutEndMs);
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
