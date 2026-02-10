/**
 * packages/core/src/focus/styles.ts — Focus styling system.
 *
 * Why: Provides configurable focus indicators for terminal UI including
 * focus rings, cursor styles, and keyboard navigation visual hints.
 *
 * Focus indicator types:
 *   - ring: Border/outline around focused element
 *   - underline: Underline indicator for text elements
 *   - background: Background color highlight
 *   - bracket: Left/right bracket indicators [  ]
 *   - arrow: Arrow pointer indicator >
 *
 * @see docs/styling/focus-styles.md
 */

import type { TextStyle } from "../widgets/style.js";

/**
 * Focus ring glyph set for outlining focused elements.
 */
export type FocusRingGlyphSet = Readonly<{
  topLeft: string;
  top: string;
  topRight: string;
  left: string;
  right: string;
  bottomLeft: string;
  bottom: string;
  bottomRight: string;
}>;

/**
 * Focus indicator type.
 */
export type FocusIndicatorType =
  | "ring"
  | "underline"
  | "background"
  | "bracket"
  | "arrow"
  | "dot"
  | "caret"
  | "none";

/**
 * Focus ring style variant.
 */
export type FocusRingVariant = "single" | "double" | "rounded" | "heavy" | "dashed" | "dotted";

/**
 * Focus configuration for a widget.
 */
export type FocusConfig = Readonly<{
  /** Type of focus indicator to show */
  indicator?: FocusIndicatorType;
  /** Focus ring variant (when indicator is "ring") */
  ringVariant?: FocusRingVariant;
  /** Style for the focus indicator */
  style?: TextStyle;
  /** Style for focused text/content */
  contentStyle?: TextStyle;
  /** Animation effect (for terminals that support it) */
  animation?: FocusAnimation;
  /** Show keyboard hint badge */
  showHint?: boolean;
  /** Custom keyboard hint text */
  hintText?: string;
}>;

/**
 * Focus animation type.
 */
export type FocusAnimation = "none" | "blink" | "pulse" | "glow";

/**
 * Single line focus ring glyphs.
 */
export const FOCUS_RING_SINGLE: FocusRingGlyphSet = {
  topLeft: "┌",
  top: "─",
  topRight: "┐",
  left: "│",
  right: "│",
  bottomLeft: "└",
  bottom: "─",
  bottomRight: "┘",
};

/**
 * Double line focus ring glyphs.
 */
export const FOCUS_RING_DOUBLE: FocusRingGlyphSet = {
  topLeft: "╔",
  top: "═",
  topRight: "╗",
  left: "║",
  right: "║",
  bottomLeft: "╚",
  bottom: "═",
  bottomRight: "╝",
};

/**
 * Rounded focus ring glyphs.
 */
export const FOCUS_RING_ROUNDED: FocusRingGlyphSet = {
  topLeft: "╭",
  top: "─",
  topRight: "╮",
  left: "│",
  right: "│",
  bottomLeft: "╰",
  bottom: "─",
  bottomRight: "╯",
};

/**
 * Heavy focus ring glyphs.
 */
export const FOCUS_RING_HEAVY: FocusRingGlyphSet = {
  topLeft: "┏",
  top: "━",
  topRight: "┓",
  left: "┃",
  right: "┃",
  bottomLeft: "┗",
  bottom: "━",
  bottomRight: "┛",
};

/**
 * Dashed focus ring glyphs.
 */
export const FOCUS_RING_DASHED: FocusRingGlyphSet = {
  topLeft: "┌",
  top: "╌",
  topRight: "┐",
  left: "╎",
  right: "╎",
  bottomLeft: "└",
  bottom: "╌",
  bottomRight: "┘",
};

/**
 * Dotted focus ring glyphs.
 */
export const FOCUS_RING_DOTTED: FocusRingGlyphSet = {
  topLeft: "·",
  top: "·",
  topRight: "·",
  left: "·",
  right: "·",
  bottomLeft: "·",
  bottom: "·",
  bottomRight: "·",
};

/**
 * Get focus ring glyph set by variant.
 */
export function getFocusRingGlyphs(variant: FocusRingVariant): FocusRingGlyphSet {
  switch (variant) {
    case "single":
      return FOCUS_RING_SINGLE;
    case "double":
      return FOCUS_RING_DOUBLE;
    case "rounded":
      return FOCUS_RING_ROUNDED;
    case "heavy":
      return FOCUS_RING_HEAVY;
    case "dashed":
      return FOCUS_RING_DASHED;
    case "dotted":
      return FOCUS_RING_DOTTED;
  }
}

/**
 * Bracket indicators for focused elements.
 */
export type FocusBracketSet = Readonly<{
  left: string;
  right: string;
}>;

/**
 * Standard bracket indicators.
 */
export const FOCUS_BRACKETS_SQUARE: FocusBracketSet = {
  left: "[",
  right: "]",
};

/**
 * Angle bracket indicators.
 */
export const FOCUS_BRACKETS_ANGLE: FocusBracketSet = {
  left: "‹",
  right: "›",
};

/**
 * Double angle bracket indicators.
 */
export const FOCUS_BRACKETS_DOUBLE_ANGLE: FocusBracketSet = {
  left: "«",
  right: "»",
};

/**
 * Chevron bracket indicators.
 */
export const FOCUS_BRACKETS_CHEVRON: FocusBracketSet = {
  left: "❮",
  right: "❯",
};

/**
 * Arrow indicators for focused elements.
 */
export type FocusArrowSet = Readonly<{
  indicator: string;
  filled?: string;
}>;

/**
 * Standard arrow indicator.
 */
export const FOCUS_ARROW_STANDARD: FocusArrowSet = {
  indicator: ">",
  filled: "▶",
};

/**
 * Triangle arrow indicator.
 */
export const FOCUS_ARROW_TRIANGLE: FocusArrowSet = {
  indicator: "▸",
  filled: "▶",
};

/**
 * Dot indicator.
 */
export const FOCUS_DOT: FocusArrowSet = {
  indicator: "○",
  filled: "●",
};

/**
 * Caret indicator.
 */
export const FOCUS_CARET: FocusArrowSet = {
  indicator: "›",
  filled: "»",
};

/**
 * Cursor line indicator styles.
 */
export type CursorLineStyle = "none" | "underline" | "block" | "bar" | "box";

/**
 * Cursor line configuration.
 */
export type CursorLineConfig = Readonly<{
  /** Cursor style */
  style: CursorLineStyle;
  /** Cursor character (for custom cursors) */
  char?: string;
  /** Cursor blinking enabled */
  blink?: boolean;
  /** Cursor color style */
  cursorStyle?: TextStyle;
}>;

/**
 * Cursor characters for different styles.
 */
export const CURSOR_CHARS: Record<CursorLineStyle, string> = {
  none: " ",
  underline: "▁",
  block: "█",
  bar: "│",
  box: "▏",
};

/**
 * Keyboard hint badge configuration.
 */
export type KeyboardHintConfig = Readonly<{
  /** Show keyboard shortcut hints */
  show: boolean;
  /** Style for hint badges */
  style?: TextStyle;
  /** Position of hints relative to focused element */
  position?: "inline" | "above" | "below" | "right";
  /** Format for key hints */
  format?: "bracket" | "parenthesis" | "plain";
}>;

/**
 * Format a keyboard shortcut for display.
 */
export function formatKeyboardHint(
  key: string,
  format: KeyboardHintConfig["format"] = "bracket",
): string {
  switch (format) {
    case "bracket":
      return `[${key}]`;
    case "parenthesis":
      return `(${key})`;
    case "plain":
      return key;
  }
}

/**
 * Common keyboard hints.
 */
export const KEYBOARD_HINTS = {
  enter: "Enter",
  space: "Space",
  escape: "Esc",
  tab: "Tab",
  arrowUp: "↑",
  arrowDown: "↓",
  arrowLeft: "←",
  arrowRight: "→",
  backspace: "⌫",
  delete: "Del",
} as const;

/**
 * Focus state for a widget.
 */
export type FocusState = Readonly<{
  /** Is the widget focused */
  isFocused: boolean;
  /** Is the widget in the focus path (parent of focused) */
  isInFocusPath: boolean;
  /** Is keyboard navigation active */
  isKeyboardNavigation: boolean;
  /** Focus ring should be visible */
  showFocusRing: boolean;
}>;

/**
 * Determine if focus ring should be shown based on focus state and config.
 */
export function shouldShowFocusRing(state: FocusState, config?: FocusConfig): boolean {
  if (config?.indicator === "none") return false;
  return state.isFocused && (state.showFocusRing || state.isKeyboardNavigation);
}

/**
 * Default focus configurations for different widget types.
 */
export const DEFAULT_FOCUS_CONFIGS: Record<string, FocusConfig> = {
  button: {
    indicator: "bracket",
    style: { bold: true },
    showHint: true,
    hintText: "Enter",
  },
  input: {
    indicator: "underline",
    animation: "blink",
    showHint: false,
  },
  select: {
    indicator: "bracket",
    showHint: true,
    hintText: "↑↓",
  },
  checkbox: {
    indicator: "arrow",
    showHint: true,
    hintText: "Space",
  },
  radioGroup: {
    indicator: "arrow",
    showHint: true,
    hintText: "↑↓",
  },
  tree: {
    indicator: "background",
    showHint: true,
    hintText: "←→↑↓",
  },
  table: {
    indicator: "background",
    showHint: true,
    hintText: "↑↓",
  },
  modal: {
    indicator: "ring",
    ringVariant: "rounded",
    showHint: false,
  },
};

/**
 * Get default focus config for a widget kind.
 */
export function getDefaultFocusConfig(kind: string): FocusConfig {
  return DEFAULT_FOCUS_CONFIGS[kind] ?? { indicator: "ring", ringVariant: "single" };
}
