/**
 * packages/core/src/runtime/inputEditor.ts — Input widget text editing.
 *
 * Why: Handles text editing operations for Input widgets, including cursor
 * movement, character insertion, deletion, and paste handling. Uses grapheme
 * cluster boundaries for correct cursor positioning with complex Unicode.
 *
 * Editing operations:
 *   - Left/Right: move cursor by grapheme cluster
 *   - Home/End: move cursor to start/end
 *   - Backspace: delete grapheme cluster before cursor
 *   - Delete: delete grapheme cluster after cursor
 *   - Text event: insert Unicode scalar at cursor
 *   - Paste event: insert UTF-8 text (CR/LF stripped)
 *
 * @see docs/widgets/input.md
 */

import type { ZrevEvent } from "../events.js";
import { GCB, gcbClass, isExtendedPictographic } from "../layout/unicode/props.js";

/* --- Key Codes (locked by engine ABI) --- */
/* See: docs/protocol/abi.md */
const ZR_KEY_LEFT = 22;
const ZR_KEY_RIGHT = 23;
const ZR_KEY_HOME = 12;
const ZR_KEY_END = 13;
const ZR_KEY_BACKSPACE = 4;
const ZR_KEY_DELETE = 11;

type DecodeOne = Readonly<{ scalar: number; size: 1 | 2 }>;

function decodeUtf16One(text: string, off: number): DecodeOne {
  const a = text.charCodeAt(off);
  if (!Number.isFinite(a)) {
    // Unreachable under a well-typed caller, but keep total behavior deterministic.
    return { scalar: 0xfffd, size: 1 };
  }

  // High surrogate
  if (a >= 0xd800 && a <= 0xdbff) {
    const b = text.charCodeAt(off + 1);
    // Valid surrogate pair
    if (b >= 0xdc00 && b <= 0xdfff) {
      const hi = a - 0xd800;
      const lo = b - 0xdc00;
      return { scalar: 0x10000 + (hi << 10) + lo, size: 2 };
    }
    // Unpaired high surrogate -> U+FFFD
    return { scalar: 0xfffd, size: 1 };
  }

  // Unpaired low surrogate -> U+FFFD
  if (a >= 0xdc00 && a <= 0xdfff) {
    return { scalar: 0xfffd, size: 1 };
  }

  return { scalar: a, size: 1 };
}

function shouldBreak(
  prevClass: number,
  prevZwjAfterEp: boolean,
  riRun: number,
  nextClass: number,
  nextIsEp: boolean,
): boolean {
  // GB3: CR x LF
  if (prevClass === GCB.CR && nextClass === GCB.LF) return false;

  // GB4/5: break around controls
  if (prevClass === GCB.CONTROL || prevClass === GCB.CR || prevClass === GCB.LF) return true;
  if (nextClass === GCB.CONTROL || nextClass === GCB.CR || nextClass === GCB.LF) return true;

  // GB6: L x (L|V|LV|LVT)
  if (
    prevClass === GCB.L &&
    (nextClass === GCB.L || nextClass === GCB.V || nextClass === GCB.LV || nextClass === GCB.LVT)
  ) {
    return false;
  }

  // GB7: (LV|V) x (V|T)
  if (
    (prevClass === GCB.LV || prevClass === GCB.V) &&
    (nextClass === GCB.V || nextClass === GCB.T)
  ) {
    return false;
  }

  // GB8: (LVT|T) x T
  if ((prevClass === GCB.LVT || prevClass === GCB.T) && nextClass === GCB.T) {
    return false;
  }

  // GB9: x Extend
  if (nextClass === GCB.EXTEND) return false;

  // GB9a: x SpacingMark
  if (nextClass === GCB.SPACINGMARK) return false;

  // GB9b: Prepend x
  if (prevClass === GCB.PREPEND) return false;

  // GB9c: x ZWJ
  if (nextClass === GCB.ZWJ) return false;

  // GB11: ... ZWJ x EP when ZWJ is preceded by EP (ignoring Extend).
  if (prevClass === GCB.ZWJ && nextIsEp && prevZwjAfterEp) return false;

  // GB12/13: Pair regional indicators.
  if (prevClass === GCB.REGIONAL_INDICATOR && nextClass === GCB.REGIONAL_INDICATOR) {
    return riRun % 2 === 0;
  }

  return true;
}

function nextClusterEnd(text: string, startOff: number): number {
  if (startOff >= text.length) return text.length;

  const start = startOff;
  let off = startOff;

  const prevDec = decodeUtf16One(text, off);
  off += prevDec.size;

  let prevClass = gcbClass(prevDec.scalar);
  const prevIsEp = isExtendedPictographic(prevDec.scalar);

  let riRun = prevClass === GCB.REGIONAL_INDICATOR ? 1 : 0;

  // GB11 state tracking: ExtPict Extend* ZWJ x ExtPict
  let lastNonExtendIsEp = prevClass !== GCB.EXTEND ? prevIsEp : false;
  let prevZwjAfterEp = prevClass === GCB.ZWJ ? lastNonExtendIsEp : false;

  while (off < text.length) {
    const nextOff = off;
    const nextDec = decodeUtf16One(text, nextOff);
    const nextClass = gcbClass(nextDec.scalar);
    const nextIsEp = isExtendedPictographic(nextDec.scalar);

    if (shouldBreak(prevClass, prevZwjAfterEp, riRun, nextClass, nextIsEp)) {
      break;
    }

    off += nextDec.size;

    if (nextClass === GCB.REGIONAL_INDICATOR) riRun++;
    else riRun = 0;

    prevZwjAfterEp = false;
    if (nextClass === GCB.ZWJ) prevZwjAfterEp = lastNonExtendIsEp;
    if (nextClass !== GCB.EXTEND) lastNonExtendIsEp = nextIsEp;

    prevClass = nextClass;
  }

  // Defensive progress guard: if decode returned 0-sized, force progress deterministically.
  if (off === start) return start + 1;
  return off;
}

function prevBoundary(value: string, cursor: number): number {
  if (cursor <= 0) return 0;
  let off = 0;
  let last = 0;
  while (off < value.length) {
    const end = nextClusterEnd(value, off);
    if (end >= cursor) return last;
    last = end;
    off = end;
  }
  return last;
}

function nextBoundary(value: string, cursor: number): number {
  if (cursor >= value.length) return value.length;
  let off = 0;
  while (off < value.length) {
    const end = nextClusterEnd(value, off);
    if (end > cursor) return end;
    off = end;
  }
  return value.length;
}

/**
 * Normalize cursor position to a valid grapheme cluster boundary.
 * Clamps to [0, value.length] and snaps to nearest cluster boundary.
 */
export function normalizeInputCursor(value: string, cursor: number): number {
  let c = cursor;
  if (!Number.isFinite(c)) c = 0;
  if (c < 0) c = 0;
  if (c > value.length) c = value.length;
  if (c === 0 || c === value.length) return c;

  let off = 0;
  let last = 0;
  while (off < value.length) {
    const end = nextClusterEnd(value, off);
    if (end === c) return c;
    if (end > c) return last;
    last = end;
    off = end;
  }
  return value.length;
}

function asUnicodeScalarString(codepoint: number): string {
  if (!Number.isFinite(codepoint)) return "\ufffd";
  const cp = Math.trunc(codepoint);
  if (cp < 0 || cp > 0x10ffff) return "\ufffd";
  if (cp >= 0xd800 && cp <= 0xdfff) return "\ufffd";
  return String.fromCodePoint(cp);
}

function removeCrLf(s: string): string {
  if (s.length === 0) return s;
  // Single-pass removal for determinism and to avoid regex engine variability.
  const out: string[] = [];
  let changed = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s.charCodeAt(i);
    if (ch === 0x0a || ch === 0x0d) {
      changed = true;
      continue;
    }
    out.push(s[i] ?? "");
  }
  return changed ? out.join("") : s;
}

const UTF8_DECODER = new TextDecoder("utf-8", { fatal: false });

/** Action emitted when input value changes. */
export type InputEditAction = Readonly<{
  id: string;
  action: "input";
  value: string;
  cursor: number;
}>;

/** Result of applying an edit event to an input. */
export type InputEditResult = Readonly<{
  nextValue: string;
  nextCursor: number;
  action?: InputEditAction;
}>;

/**
 * Apply a key/text/paste event to an input widget.
 *
 * @param event - Engine event to apply
 * @param ctx - Current input state (id, value, cursor)
 * @returns Edit result with new value/cursor and optional action, or null if event not applicable
 */
export function applyInputEditEvent(
  event: ZrevEvent,
  ctx: Readonly<{ id: string; value: string; cursor: number }>,
): InputEditResult | null {
  const id = ctx.id;
  const value = ctx.value;
  const cursor0 = normalizeInputCursor(value, ctx.cursor);

  if (event.kind === "key") {
    if (event.action !== "down" && event.action !== "repeat") return null;

    if (event.key === ZR_KEY_LEFT) {
      const nextCursor = prevBoundary(value, cursor0);
      return Object.freeze({ nextValue: value, nextCursor });
    }
    if (event.key === ZR_KEY_RIGHT) {
      const nextCursor = nextBoundary(value, cursor0);
      return Object.freeze({ nextValue: value, nextCursor });
    }
    if (event.key === ZR_KEY_HOME) {
      return Object.freeze({ nextValue: value, nextCursor: 0 });
    }
    if (event.key === ZR_KEY_END) {
      return Object.freeze({ nextValue: value, nextCursor: value.length });
    }
    if (event.key === ZR_KEY_BACKSPACE) {
      if (cursor0 === 0) return Object.freeze({ nextValue: value, nextCursor: cursor0 });
      const start = prevBoundary(value, cursor0);
      const nextValue = value.slice(0, start) + value.slice(cursor0);
      const nextCursor = normalizeInputCursor(nextValue, start);
      if (nextValue === value) return Object.freeze({ nextValue: value, nextCursor: cursor0 });
      const action: InputEditAction = Object.freeze({
        id,
        action: "input",
        value: nextValue,
        cursor: nextCursor,
      });
      return Object.freeze({ nextValue, nextCursor, action });
    }
    if (event.key === ZR_KEY_DELETE) {
      if (cursor0 === value.length) return Object.freeze({ nextValue: value, nextCursor: cursor0 });
      const end = nextBoundary(value, cursor0);
      const nextValue = value.slice(0, cursor0) + value.slice(end);
      const nextCursor = normalizeInputCursor(nextValue, cursor0);
      if (nextValue === value) return Object.freeze({ nextValue: value, nextCursor: cursor0 });
      const action: InputEditAction = Object.freeze({
        id,
        action: "input",
        value: nextValue,
        cursor: nextCursor,
      });
      return Object.freeze({ nextValue, nextCursor, action });
    }

    // ENTER/TAB and all other keys do not edit in P1.
    return null;
  }

  if (event.kind === "text") {
    const s = asUnicodeScalarString(event.codepoint);
    const ch = s.charCodeAt(0);
    if (ch === 0x0a || ch === 0x0d) return null;

    const nextValue = value.slice(0, cursor0) + s + value.slice(cursor0);
    const nextCursor = normalizeInputCursor(nextValue, cursor0 + s.length);
    if (nextValue === value) return Object.freeze({ nextValue: value, nextCursor: cursor0 });
    const action: InputEditAction = Object.freeze({
      id,
      action: "input",
      value: nextValue,
      cursor: nextCursor,
    });
    return Object.freeze({ nextValue, nextCursor, action });
  }

  if (event.kind === "paste") {
    const decoded = UTF8_DECODER.decode(event.bytes);
    const inserted = removeCrLf(decoded);
    if (inserted.length === 0) return null;

    const nextValue = value.slice(0, cursor0) + inserted + value.slice(cursor0);
    const nextCursor = normalizeInputCursor(nextValue, cursor0 + inserted.length);
    if (nextValue === value) return Object.freeze({ nextValue: value, nextCursor: cursor0 });
    const action: InputEditAction = Object.freeze({
      id,
      action: "input",
      value: nextValue,
      cursor: nextCursor,
    });
    return Object.freeze({ nextValue, nextCursor, action });
  }

  return null;
}
