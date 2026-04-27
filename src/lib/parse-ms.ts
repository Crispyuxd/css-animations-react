import type { TimeValue } from './types';

export function parseMs(val: TimeValue): number {
  if (typeof val === 'number') return val;
  const s = val.trim();
  if (s.endsWith('ms')) return parseFloat(s);
  if (s.endsWith('s')) return parseFloat(s) * 1000;
  return parseFloat(s);
}
