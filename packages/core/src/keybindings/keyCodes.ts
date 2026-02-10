/**
 * packages/core/src/keybindings/keyCodes.ts — Key code constants and mapping.
 *
 * Why: Provides named constants for key codes matching the engine ABI, plus
 * utilities for converting between key names, characters, and numeric codes.
 * These are locked by the engine ABI and MUST match docs/protocol/abi.md.
 *
 * @see docs/protocol/abi.md
 */

import type { Modifiers } from "./types.js";

/* --- Key Codes (locked by engine ABI) --- */

export const ZR_KEY_UNKNOWN = 0;
export const ZR_KEY_ESCAPE = 1;
export const ZR_KEY_ENTER = 2;
export const ZR_KEY_TAB = 3;
export const ZR_KEY_BACKSPACE = 4;

export const ZR_KEY_INSERT = 10;
export const ZR_KEY_DELETE = 11;
export const ZR_KEY_HOME = 12;
export const ZR_KEY_END = 13;
export const ZR_KEY_PAGE_UP = 14;
export const ZR_KEY_PAGE_DOWN = 15;

export const ZR_KEY_UP = 20;
export const ZR_KEY_DOWN = 21;
export const ZR_KEY_LEFT = 22;
export const ZR_KEY_RIGHT = 23;

export const ZR_KEY_F1 = 100;
export const ZR_KEY_F2 = 101;
export const ZR_KEY_F3 = 102;
export const ZR_KEY_F4 = 103;
export const ZR_KEY_F5 = 104;
export const ZR_KEY_F6 = 105;
export const ZR_KEY_F7 = 106;
export const ZR_KEY_F8 = 107;
export const ZR_KEY_F9 = 108;
export const ZR_KEY_F10 = 109;
export const ZR_KEY_F11 = 110;
export const ZR_KEY_F12 = 111;

/* Space key uses ASCII codepoint */
export const ZR_KEY_SPACE = 32;

/* --- Modifier Bits (locked by engine ABI) --- */

export const ZR_MOD_SHIFT = 1 << 0;
export const ZR_MOD_CTRL = 1 << 1;
export const ZR_MOD_ALT = 1 << 2;
export const ZR_MOD_META = 1 << 3;

/* --- Key Name to Code Mapping --- */

/**
 * Map of lowercase key names to their key codes.
 * Used by the parser to convert string representations.
 */
export const KEY_NAME_TO_CODE: ReadonlyMap<string, number> = new Map<string, number>([
  // Special keys
  ["escape", ZR_KEY_ESCAPE],
  ["esc", ZR_KEY_ESCAPE],
  ["enter", ZR_KEY_ENTER],
  ["return", ZR_KEY_ENTER],
  ["tab", ZR_KEY_TAB],
  ["backspace", ZR_KEY_BACKSPACE],
  ["space", ZR_KEY_SPACE],

  // Navigation keys
  ["insert", ZR_KEY_INSERT],
  ["delete", ZR_KEY_DELETE],
  ["del", ZR_KEY_DELETE],
  ["home", ZR_KEY_HOME],
  ["end", ZR_KEY_END],
  ["pageup", ZR_KEY_PAGE_UP],
  ["pagedown", ZR_KEY_PAGE_DOWN],

  // Arrow keys
  ["up", ZR_KEY_UP],
  ["down", ZR_KEY_DOWN],
  ["left", ZR_KEY_LEFT],
  ["right", ZR_KEY_RIGHT],

  // Function keys
  ["f1", ZR_KEY_F1],
  ["f2", ZR_KEY_F2],
  ["f3", ZR_KEY_F3],
  ["f4", ZR_KEY_F4],
  ["f5", ZR_KEY_F5],
  ["f6", ZR_KEY_F6],
  ["f7", ZR_KEY_F7],
  ["f8", ZR_KEY_F8],
  ["f9", ZR_KEY_F9],
  ["f10", ZR_KEY_F10],
  ["f11", ZR_KEY_F11],
  ["f12", ZR_KEY_F12],
]);

/**
 * Set of valid modifier names (lowercase).
 */
export const MODIFIER_NAMES: ReadonlySet<string> = new Set([
  "shift",
  "ctrl",
  "control",
  "alt",
  "meta",
  "cmd",
  "command",
  "win",
  "super",
]);

/**
 * Convert a single character to its key code.
 * Letters are converted to uppercase ASCII (A-Z = 65-90).
 * Digits use their ASCII values (0-9 = 48-57).
 *
 * @param char - Single character to convert
 * @returns Key code, or null if not a valid single-char key
 */
export function charToKeyCode(char: string): number | null {
  if (char.length !== 1) return null;

  const code = char.charCodeAt(0);

  // Lowercase letters -> uppercase
  if (code >= 97 && code <= 122) {
    return code - 32; // 'a' (97) -> 'A' (65)
  }

  // Uppercase letters
  if (code >= 65 && code <= 90) {
    return code;
  }

  // Digits
  if (code >= 48 && code <= 57) {
    return code;
  }

  // Common punctuation/symbols (use ASCII directly)
  // This includes: !"#$%&'()*+,-./:;<=>?@[\]^_`{|}~
  if (code >= 32 && code <= 126) {
    return code;
  }

  return null;
}

/** Empty modifiers object (all false). */
const MODS_BY_MASK: readonly Modifiers[] = (() => {
  const entries: Modifiers[] = [];
  for (let mask = 0; mask < 16; mask++) {
    entries[mask] = Object.freeze({
      shift: (mask & ZR_MOD_SHIFT) !== 0,
      ctrl: (mask & ZR_MOD_CTRL) !== 0,
      alt: (mask & ZR_MOD_ALT) !== 0,
      meta: (mask & ZR_MOD_META) !== 0,
    });
  }
  return Object.freeze(entries);
})();

export const EMPTY_MODS: Modifiers =
  MODS_BY_MASK[0] ?? Object.freeze({ shift: false, ctrl: false, alt: false, meta: false });

/**
 * Convert a modifier bitmask to a Modifiers object.
 *
 * @param n - Bitmask using ZR_MOD_* bits
 * @returns Modifiers object
 */
export function modsFromBitmask(n: number): Modifiers {
  return MODS_BY_MASK[n & 0x0f] ?? EMPTY_MODS;
}

/**
 * Convert a Modifiers object to a bitmask.
 *
 * @param mods - Modifiers object
 * @returns Bitmask using ZR_MOD_* bits
 */
export function modsToBitmask(mods: Modifiers): number {
  let bits = 0;
  if (mods.shift) bits |= ZR_MOD_SHIFT;
  if (mods.ctrl) bits |= ZR_MOD_CTRL;
  if (mods.alt) bits |= ZR_MOD_ALT;
  if (mods.meta) bits |= ZR_MOD_META;
  return bits;
}

/**
 * Create a string key for trie lookup from key code and modifiers.
 *
 * @param keyCode - Numeric key code
 * @param mods - Modifiers object
 * @returns String key in format "keyCode:modsBitmask"
 */
export function makeTrieKey(keyCode: number, mods: Modifiers): string {
  return `${String(keyCode)}:${String(modsToBitmask(mods))}`;
}
