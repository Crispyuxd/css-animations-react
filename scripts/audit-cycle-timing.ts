/* eslint-disable @typescript-eslint/no-explicit-any */
// Audit cycle-end timing across every demo's timeline.ts.
//
// Walks each timeline with the same cursor-advance rules as the runtime
// engine in src/lib/timeline-engine.ts, and tracks the latest moment any
// visual animation completes (which can extend past the cursor when a step
// uses `parallel: true` or when a meta's fadeOut runs after its hold).
//
// Output per demo:
//   cycle           configured cycle length
//   lastVisualEnd   max end-time across every step
//   stackFadeStart  cycle − outroFade − 0.9s  (when messagesStack starts fading)
//   stackFadeEnd    cycle − 0.9s              (when messagesStack reaches opacity 0)
//   dwell           stackFadeStart − lastVisualEnd  (stillness before fade)
//   trailingBlank   cycle − stackFadeEnd      (always 0.9s with default outroFade)
//
// Run: npx tsx scripts/audit-cycle-timing.ts

import { parseMs } from '../src/lib/parse-ms';
import type { TimelineConfig, TimelineStep } from '../src/lib/types';

import { timeline as escalation } from '../src/app/demos/escalation/timeline';
import { timeline as forms } from '../src/app/demos/forms/timeline';
import { timeline as button } from '../src/app/demos/button/timeline';
import { timeline as calendar } from '../src/app/demos/calendar/timeline';
import { timeline as customActions } from '../src/app/demos/custom-actions/timeline';
import { timeline as slack } from '../src/app/demos/slack/timeline';
import { timeline as suggestedMessages } from '../src/app/demos/suggested-messages/timeline';
import { timeline as tavily } from '../src/app/demos/tavily/timeline';
import { timeline as shopify } from '../src/app/demos/shopify/timeline';
import { timeline as leads } from '../src/app/demos/leads/timeline';
import { timeline as stripe } from '../src/app/demos/stripe/timeline';
import { timeline as transferToHuman } from '../src/app/demos/transfer-to-human/timeline';
import { timeline as collectData } from '../src/app/demos/collect-data/timeline';

const DEMOS: Array<{ name: string; cfg: TimelineConfig }> = [
  { name: 'escalation', cfg: escalation },
  { name: 'forms', cfg: forms },
  { name: 'button', cfg: button },
  { name: 'calendar', cfg: calendar },
  { name: 'custom-actions', cfg: customActions },
  { name: 'slack', cfg: slack },
  { name: 'suggested-messages', cfg: suggestedMessages },
  { name: 'tavily', cfg: tavily },
  { name: 'shopify', cfg: shopify },
  { name: 'leads', cfg: leads },
  { name: 'stripe', cfg: stripe },
  { name: 'transfer-to-human', cfg: transferToHuman },
  { name: 'collect-data', cfg: collectData },
];

type Walker = {
  cursor: number;
  maxEnd: number;
  events: Array<{ kind: string; id?: string; start: number; end: number }>;
};

function bump(w: Walker, end: number) {
  if (end > w.maxEnd) w.maxEnd = end;
}

function walkMeta(
  w: Walker,
  cfg: TimelineConfig,
  m: { id?: string; fadeIn?: any; hold?: any; fadeOut?: any; pause?: any; parallel?: boolean },
) {
  const fadeIn = parseMs(m.fadeIn ?? cfg.metaFadeIn ?? '0.36s');
  const hold = parseMs(m.hold ?? cfg.metaHold ?? '0.9s');
  const fadeOut = parseMs(m.fadeOut ?? cfg.metaFadeOut ?? '0.15s');
  const start = w.cursor;
  // When fadeOut is 0, the engine emits no fade-out stop — the meta holds at
  // opacity 1 until 100%, so the `hold` value is purely a cursor advance and
  // has no visual effect. The last visual change is the fade-in completing.
  const visualEnd = fadeOut > 0 ? start + fadeIn + hold + fadeOut : start + fadeIn;
  w.events.push({ kind: 'meta', id: m.id, start, end: visualEnd });
  bump(w, visualEnd);
  if (m.parallel) {
    w.cursor = start + fadeIn;
  } else {
    w.cursor = start + fadeIn + hold + parseMs(m.pause ?? '0s');
  }
}

function walk(cfg: TimelineConfig): Walker {
  const introMs = parseMs(cfg.introHold ?? '0.36s');
  const w: Walker = { cursor: introMs, maxEnd: introMs, events: [] };

  // Mirror engine state — only what affects timing:
  const widgetTimes: Record<string, number> = {}; // widget end → for transition combine
  const lineEnd: Record<string, number> = {}; // for untype tracking (not needed for timing)
  const cursorParked: Record<string, boolean> = {};
  const cursorInit: Record<string, boolean> = {};

  for (const step of cfg.steps as TimelineStep[]) {
    const start = w.cursor;

    if (step.type === 'bot') {
      if (Array.isArray((step as any).lines)) {
        const baseCps = (step as any).cps ?? 90;
        const accel = (step as any).accel ?? 0.45;
        const lines: number[] = (step as any).lines;
        let c = start;
        for (let i = 0; i < lines.length; i++) {
          const chars = Math.max(1, lines[i]);
          // Linear per-line speed-up, matching the engine's
          // baseCps * (1 + i * accel). Not the old compounding accel^i.
          // Same 0.1 floor as the engine, so a decelerating accel can't reach
          // zero cps and produce an infinite duration.
          const cps = baseCps * Math.max(0.1, 1 + i * accel);
          const dur = (chars / cps) * 1000;
          const lineId = `${(step as any).id}-line-${i + 1}`;
          lineEnd[lineId] = c + dur;
          c += dur;
          // 120ms of silence between lines, but not after the last.
          if (i < lines.length - 1) c += 120;
        }
        w.cursor = c;
        bump(w, c);
        w.events.push({ kind: 'bot', id: (step as any).id, start, end: c });
        if ((step as any).meta) walkMeta(w, cfg, (step as any).meta);
        w.cursor += parseMs((step as any).pause ?? '0s');
      } else {
        const dur = parseMs((step as any).duration ?? '1.26s');
        w.cursor = start + dur;
        bump(w, w.cursor);
        w.events.push({ kind: 'bot', id: (step as any).id, start, end: w.cursor });
        if ((step as any).meta) walkMeta(w, cfg, (step as any).meta);
        w.cursor += parseMs((step as any).pause ?? '0s');
      }
    } else if (step.type === 'meta') {
      walkMeta(w, cfg, step as any);
    } else if (step.type === 'user') {
      const dur = parseMs((step as any).duration ?? '0.48s');
      const end = start + dur;
      w.events.push({ kind: 'user', id: (step as any).id, start, end });
      bump(w, end);
      w.cursor = end + parseMs((step as any).pause ?? '0s');
    } else if (step.type === 'thinking') {
      // The indicator fades in, dwells, then cuts out. The cursor advances by
      // the dwell alone, so the reply below starts on the cut frame.
      const dwell = parseMs((step as any).duration ?? '1.2s');
      const end = start + dwell;
      w.events.push({ kind: 'thinking', id: (step as any).id, start, end });
      bump(w, end);
      w.cursor = end + parseMs((step as any).pause ?? '0s');
    } else if (step.type === 'divider') {
      const dur = parseMs((step as any).duration ?? '0.54s');
      const end = start + dur;
      w.events.push({ kind: 'divider', id: (step as any).id, start, end });
      bump(w, end);
      w.cursor = end + parseMs((step as any).pause ?? '0s');
    } else if (step.type === 'widget') {
      const dur = parseMs((step as any).duration ?? '0.4s');
      const end = start + dur;
      widgetTimes[(step as any).id] = end;
      let visualEnd = end;
      if ((step as any).shimmer) {
        visualEnd = end + parseMs('0.35s'); // engine adds 0.35s shimmer tail
      }
      w.events.push({ kind: 'widget', id: (step as any).id, start, end: visualEnd });
      bump(w, visualEnd);
      if (!(step as any).parallel) {
        w.cursor = end + parseMs((step as any).pause ?? '0s');
      }
    } else if (step.type === 'cursor') {
      const id = (step as any).id;
      let c = start;
      if (!cursorInit[id]) {
        c += parseMs((step as any).appear ?? '0.3s');
        cursorInit[id] = true;
      } else if (!cursorParked[id]) {
        c += parseMs((step as any).appear ?? '0.18s');
      }
      for (const wp of (step as any).waypoints as any[]) {
        c += parseMs(wp.travel ?? '0.5s');
        const click = parseMs(wp.click ?? '0.12s');
        c += click * 2; // press-down then release
        c += parseMs(wp.pause ?? '0.2s');
      }
      if ((step as any).rest) {
        c += parseMs((step as any).rest.travel ?? '0.5s');
        cursorParked[id] = true;
      } else {
        c += parseMs('0.18s'); // disappear fade-out
        cursorParked[id] = false;
      }
      w.events.push({ kind: 'cursor', id, start, end: c });
      bump(w, c);
      w.cursor = c;
    } else if (step.type === 'scroll') {
      const dur = parseMs((step as any).duration ?? '0.5s');
      const end = start + dur;
      w.events.push({ kind: 'scroll', id: (step as any).target, start, end });
      bump(w, end);
      if (!(step as any).parallel) {
        w.cursor = end + parseMs((step as any).pause ?? '0s');
      }
    } else if (step.type === 'select') {
      const dur = parseMs((step as any).duration ?? '0.15s');
      w.cursor = start + dur + parseMs((step as any).pause ?? '0s');
      bump(w, start + dur);
    } else if (step.type === 'shimmer') {
      const dur = parseMs((step as any).duration ?? '0.45s');
      const visualEnd = start + dur + parseMs('0.35s'); // engine 0.35s tail
      w.events.push({ kind: 'shimmer', id: (step as any).target, start, end: visualEnd });
      bump(w, visualEnd);
      w.cursor = start + parseMs((step as any).pause ?? '0s');
    } else if (step.type === 'untype') {
      const dur = parseMs((step as any).duration ?? '0.5s');
      const end = start + dur;
      w.events.push({ kind: 'untype', id: (step as any).target, start, end });
      bump(w, end);
      w.cursor = end + parseMs((step as any).pause ?? '0s');
    } else if (step.type === 'deselect') {
      const dur = parseMs((step as any).duration ?? '0.2s');
      w.cursor = start + dur + parseMs((step as any).pause ?? '0s');
      bump(w, start + dur);
    } else if (step.type === 'voicecall') {
      const connecting = parseMs((step as any).connecting ?? '1.4s');
      const settling = parseMs((step as any).settling ?? '0.7s');
      const morphing = parseMs((step as any).morphing ?? '0.46s');
      // The cursor advances by the three phase lengths, but the last bar keeps
      // moving a little past them: it starts its grow 6 * 40ms into the morph
      // phase, grows for 420ms, then eases its amplitude up from the trough over
      // the engine's WAVE_IN_MS. The idle oscillation from there on is ambient, so
      // it is not counted as a visual end — including with an `outro`, which lands
      // the wave on rest at exactly stackFadeStart and would otherwise read here
      // as a 0s dwell with an overrun. Mirror of the engine's voicecall block;
      // neither the outro nor a surface morph changes the cursor, so the numbers
      // below still hold. Keep the 180 in step with WAVE_IN_MS.
      const lastBar = 6 * 40 + 420 + 180;
      const visualEnd = start + connecting + settling + lastBar;
      w.events.push({ kind: 'voicecall', id: (step as any).id, start, end: visualEnd });
      bump(w, visualEnd);
      w.cursor = start + connecting + settling + morphing + parseMs((step as any).pause ?? '0s');
    } else if (step.type === 'transition') {
      const dur = parseMs((step as any).duration ?? '0.4s');
      const end = start + dur;
      w.events.push({ kind: 'transition', id: `${(step as any).hide}→${(step as any).show}`, start, end });
      bump(w, end);
      if (!(step as any).parallel) {
        w.cursor = end + parseMs((step as any).pause ?? '0s');
      }
    } else {
      // Unknown step — skip
    }
  }
  return w;
}

function fmt(ms: number): string {
  return (ms / 1000).toFixed(2) + 's';
}

function row(cells: string[], widths: number[]): string {
  return cells.map((c, i) => c.padEnd(widths[i])).join('  ');
}

console.log('\nCycle-end timing audit\n');
const headers = ['demo', 'cycle', 'lastEnd', 'fadeStart', 'fadeEnd', 'dwell', 'overrun?'];
const widths = [22, 8, 9, 10, 9, 8, 10];
console.log(row(headers, widths));
console.log(row(headers.map(h => '-'.repeat(h.length)), widths));

const rows: Array<{ name: string; cycle: number; lastEnd: number; fadeStart: number; dwell: number }> = [];
for (const { name, cfg } of DEMOS) {
  const cycleMs = parseMs(cfg.cycle);
  const outroMs = parseMs(cfg.outroFade ?? '0.9s');
  const stackFadeStart = cycleMs - outroMs - 900;
  const stackFadeEnd = cycleMs - 900;
  const w = walk(cfg);
  const dwell = stackFadeStart - w.maxEnd;
  rows.push({ name, cycle: cycleMs, lastEnd: w.maxEnd, fadeStart: stackFadeStart, dwell });
  const overrun = w.maxEnd > stackFadeStart ? '!! ' + fmt(w.maxEnd - stackFadeStart) : '';
  console.log(
    row(
      [
        name,
        fmt(cycleMs),
        fmt(w.maxEnd),
        fmt(stackFadeStart),
        fmt(stackFadeEnd),
        fmt(dwell),
        overrun,
      ],
      widths,
    ),
  );
}

console.log('\nLegend:');
console.log('  cycle      configured cycle length');
console.log('  lastEnd    last moment any visual animation completes');
console.log('  fadeStart  when messagesStack starts fading (cycle − outroFade − 0.9s)');
console.log('  fadeEnd    when messagesStack reaches opacity 0   (cycle − 0.9s)');
console.log('  dwell      fadeStart − lastEnd (stillness window before fade-out)');
console.log('  overrun?   set if lastEnd > fadeStart (animation finishes during the fade)');

const dwells = rows.map(r => r.dwell);
const minD = Math.min(...dwells);
const maxD = Math.max(...dwells);
console.log(`\nDwell range: ${fmt(minD)} – ${fmt(maxD)}  (spread ${fmt(maxD - minD)})`);
