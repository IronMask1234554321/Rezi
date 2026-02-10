/**
 * Box border glyphs for widget rendering.
 *
 * Deterministic constants for border rendering.
 * Unicode: box drawing characters.
 *
 * Glyph positions:
 *   TL ─── H ─── TR
 *   │             │
 *   V             V
 *   │             │
 *   BL ─── H ─── BR
 *
 * T-junction positions:
 *   TH (├) - T pointing right (left edge with horizontal)
 *   TV (┬) - T pointing down (top edge with vertical)
 *   THL (┤) - T pointing left (right edge with horizontal)
 *   TVB (┴) - T pointing up (bottom edge with vertical)
 *   X (┼) - Cross junction
 */

/**
 * Complete set of box border glyphs including T-junctions.
 */
export type BorderGlyphSet = Readonly<{
  /** Top-left corner */
  TL: string;
  /** Top-right corner */
  TR: string;
  /** Bottom-left corner */
  BL: string;
  /** Bottom-right corner */
  BR: string;
  /** Horizontal line */
  H: string;
  /** Vertical line */
  V: string;
  /** T-junction horizontal right (├) */
  TH: string;
  /** T-junction vertical down (┬) */
  TV: string;
  /** T-junction horizontal left (┤) */
  THL: string;
  /** T-junction vertical up (┴) */
  TVB: string;
  /** Cross junction (┼) */
  X: string;
}>;

/**
 * Legacy type without T-junctions (backwards compatible).
 */
export type BorderGlyphs = Readonly<{
  TL: string;
  TR: string;
  BL: string;
  BR: string;
  H: string;
  V: string;
}>;

/** Single-line border glyphs (default). */
export const SINGLE: BorderGlyphSet = Object.freeze({
  TL: "┌",
  TR: "┐",
  BL: "└",
  BR: "┘",
  H: "─",
  V: "│",
  TH: "├",
  TV: "┬",
  THL: "┤",
  TVB: "┴",
  X: "┼",
});

/** Double-line border glyphs. */
export const DOUBLE: BorderGlyphSet = Object.freeze({
  TL: "╔",
  TR: "╗",
  BL: "╚",
  BR: "╝",
  H: "═",
  V: "║",
  TH: "╠",
  TV: "╦",
  THL: "╣",
  TVB: "╩",
  X: "╬",
});

/** Rounded corner border glyphs. */
export const ROUNDED: BorderGlyphSet = Object.freeze({
  TL: "╭",
  TR: "╮",
  BL: "╰",
  BR: "╯",
  H: "─",
  V: "│",
  TH: "├",
  TV: "┬",
  THL: "┤",
  TVB: "┴",
  X: "┼",
});

/** Heavy/thick border glyphs. */
export const HEAVY: BorderGlyphSet = Object.freeze({
  TL: "┏",
  TR: "┓",
  BL: "┗",
  BR: "┛",
  H: "━",
  V: "┃",
  TH: "┣",
  TV: "┳",
  THL: "┫",
  TVB: "┻",
  X: "╋",
});

/** Dashed border glyphs. */
export const DASHED: BorderGlyphSet = Object.freeze({
  TL: "┌",
  TR: "┐",
  BL: "└",
  BR: "┘",
  H: "╌",
  V: "╎",
  TH: "├",
  TV: "┬",
  THL: "┤",
  TVB: "┴",
  X: "┼",
});

/** Heavy dashed border glyphs. */
export const HEAVY_DASHED: BorderGlyphSet = Object.freeze({
  TL: "┏",
  TR: "┓",
  BL: "┗",
  BR: "┛",
  H: "╍",
  V: "╏",
  TH: "┣",
  TV: "┳",
  THL: "┫",
  TVB: "┻",
  X: "╋",
});

/**
 * Border style names.
 */
export type BorderStyle =
  | "none"
  | "single"
  | "double"
  | "rounded"
  | "heavy"
  | "dashed"
  | "heavy-dashed";

/**
 * Get border glyphs for a given style.
 *
 * @param style - Border style name
 * @returns Border glyph set, or null for "none"
 */
export function getBorderGlyphs(style: BorderStyle): BorderGlyphSet | null {
  switch (style) {
    case "single":
      return SINGLE;
    case "double":
      return DOUBLE;
    case "rounded":
      return ROUNDED;
    case "heavy":
      return HEAVY;
    case "dashed":
      return DASHED;
    case "heavy-dashed":
      return HEAVY_DASHED;
    case "none":
      return null;
  }
}

/**
 * Check if a value is a valid border style.
 */
export function isBorderStyle(value: unknown): value is BorderStyle {
  return (
    value === "none" ||
    value === "single" ||
    value === "double" ||
    value === "rounded" ||
    value === "heavy" ||
    value === "dashed" ||
    value === "heavy-dashed"
  );
}

// Legacy exports for backwards compatibility
export const { TL, TR, BL, BR, H, V } = SINGLE;
