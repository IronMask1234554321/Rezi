import {
  EAW_WIDE_RANGES_15_1_0,
  EMOJI_PRESENTATION_RANGES_15_1_0,
  EXTENDED_PICTOGRAPHIC_RANGES_15_1_0,
  GCB_RANGES_15_1_0,
} from "./tables_15_1_0.js";

export const GCB = {
  OTHER: 0,
  CR: 1,
  LF: 2,
  CONTROL: 3,
  PREPEND: 4,
  SPACINGMARK: 5,
  EXTEND: 6,
  ZWJ: 7,
  REGIONAL_INDICATOR: 8,
  L: 9,
  V: 10,
  T: 11,
  LV: 12,
  LVT: 13,
} as const;

export type GcbClass = (typeof GCB)[keyof typeof GCB];

function inRanges(ranges: Uint32Array, scalar: number): boolean {
  const n = Math.trunc(ranges.length / 2);
  let lo = 0;
  let hi = n;
  while (lo < hi) {
    const mid = lo + Math.trunc((hi - lo) / 2);
    const base = mid * 2;
    const rLo = ranges[base];
    const rHi = ranges[base + 1];
    if (rLo === undefined || rHi === undefined) return false;
    if (scalar < rLo) {
      hi = mid;
      continue;
    }
    if (scalar > rHi) {
      lo = mid + 1;
      continue;
    }
    return true;
  }
  return false;
}

function ranges8Lookup(ranges: Uint32Array, scalar: number): GcbClass {
  const n = Math.trunc(ranges.length / 3);
  let lo = 0;
  let hi = n;
  while (lo < hi) {
    const mid = lo + Math.trunc((hi - lo) / 2);
    const base = mid * 3;
    const rLo = ranges[base];
    const rHi = ranges[base + 1];
    const v = ranges[base + 2];
    if (rLo === undefined || rHi === undefined || v === undefined) return GCB.OTHER;
    if (scalar < rLo) {
      hi = mid;
      continue;
    }
    if (scalar > rHi) {
      lo = mid + 1;
      continue;
    }
    return v as GcbClass;
  }
  return GCB.OTHER;
}

export function gcbClass(scalar: number): GcbClass {
  return ranges8Lookup(GCB_RANGES_15_1_0, scalar);
}

export function isExtendedPictographic(scalar: number): boolean {
  return inRanges(EXTENDED_PICTOGRAPHIC_RANGES_15_1_0, scalar);
}

export function isEmojiPresentation(scalar: number): boolean {
  return inRanges(EMOJI_PRESENTATION_RANGES_15_1_0, scalar);
}

export function isEawWide(scalar: number): boolean {
  return inRanges(EAW_WIDE_RANGES_15_1_0, scalar);
}

export function isEmoji(scalar: number): boolean {
  return isExtendedPictographic(scalar) || isEmojiPresentation(scalar);
}
