/**
 * packages/core/src/renderer/scrollbar.ts — Scrollbar glyph system.
 *
 * Why: Provides customizable scrollbar rendering with multiple variants
 * and configurable track/thumb characters for terminal UI.
 *
 * Scrollbar variants:
 *   - minimal: Simple thin scrollbar (│ with ┃ thumb)
 *   - classic: Traditional full-width scrollbar (░ with █ thumb)
 *   - modern: Unicode block-based scrollbar (▕ with ▐ thumb)
 *   - dots: Braille-based scrollbar (⡇ with ⣿ thumb)
 *
 * @see docs/guide/runtime-and-layout.md
 */

import type { TextStyle } from "../widgets/style.js";

/**
 * Scrollbar glyph set for rendering.
 */
export type ScrollbarGlyphSet = Readonly<{
  /** Track character (background) */
  track: string;
  /** Thumb character (draggable part) */
  thumb: string;
  /** Top arrow/cap (optional) */
  arrowUp?: string;
  /** Bottom arrow/cap (optional) */
  arrowDown?: string;
  /** Left arrow/cap for horizontal scrollbars (optional) */
  arrowLeft?: string;
  /** Right arrow/cap for horizontal scrollbars (optional) */
  arrowRight?: string;
}>;

/**
 * Scrollbar visual configuration.
 */
export type ScrollbarConfig = Readonly<{
  /** Width of vertical scrollbar in cells (default: 1) */
  width?: number;
  /** Height of horizontal scrollbar in cells (default: 1) */
  height?: number;
  /** Show arrow buttons at ends (default: false) */
  showArrows?: boolean;
  /** Minimum thumb size in cells (default: 1) */
  minThumbSize?: number;
  /** Style for the track */
  trackStyle?: TextStyle;
  /** Style for the thumb */
  thumbStyle?: TextStyle;
  /** Style for arrows */
  arrowStyle?: TextStyle;
  /** Glyph set to use */
  glyphs?: ScrollbarGlyphSet;
}>;

/**
 * Scrollbar variant presets.
 */
export type ScrollbarVariant = "minimal" | "classic" | "modern" | "dots" | "thin";

/**
 * Minimal scrollbar glyphs (thin line style).
 */
export const SCROLLBAR_MINIMAL: ScrollbarGlyphSet = {
  track: "│",
  thumb: "┃",
  arrowUp: "▲",
  arrowDown: "▼",
  arrowLeft: "◀",
  arrowRight: "▶",
};

/**
 * Classic scrollbar glyphs (full-width block style).
 */
export const SCROLLBAR_CLASSIC: ScrollbarGlyphSet = {
  track: "░",
  thumb: "█",
  arrowUp: "▲",
  arrowDown: "▼",
  arrowLeft: "◄",
  arrowRight: "►",
};

/**
 * Modern scrollbar glyphs (half-block style).
 */
export const SCROLLBAR_MODERN: ScrollbarGlyphSet = {
  track: "▕",
  thumb: "▐",
  arrowUp: "△",
  arrowDown: "▽",
  arrowLeft: "◁",
  arrowRight: "▷",
};

/**
 * Dots scrollbar glyphs (braille style).
 */
export const SCROLLBAR_DOTS: ScrollbarGlyphSet = {
  track: "⡇",
  thumb: "⣿",
  arrowUp: "⡀",
  arrowDown: "⠁",
  arrowLeft: "⠈",
  arrowRight: "⠁",
};

/**
 * Thin scrollbar glyphs (minimal space).
 */
export const SCROLLBAR_THIN: ScrollbarGlyphSet = {
  track: "▏",
  thumb: "▎",
  arrowUp: "▴",
  arrowDown: "▾",
  arrowLeft: "◂",
  arrowRight: "▸",
};

/**
 * Get scrollbar glyph set by variant name.
 */
export function getScrollbarGlyphs(variant: ScrollbarVariant): ScrollbarGlyphSet {
  switch (variant) {
    case "minimal":
      return SCROLLBAR_MINIMAL;
    case "classic":
      return SCROLLBAR_CLASSIC;
    case "modern":
      return SCROLLBAR_MODERN;
    case "dots":
      return SCROLLBAR_DOTS;
    case "thin":
      return SCROLLBAR_THIN;
  }
}

/**
 * Scrollbar state for rendering.
 */
export type ScrollbarState = Readonly<{
  /** Current scroll position (0-1) */
  position: number;
  /** Visible portion size (0-1) */
  viewportRatio: number;
  /** Is the scrollbar currently being dragged */
  isDragging?: boolean;
  /** Is the scrollbar hovered */
  isHovered?: boolean;
}>;

/**
 * Calculate thumb position and size for a scrollbar.
 *
 * @param trackSize - Total size of the scrollbar track in cells
 * @param state - Current scrollbar state
 * @param config - Scrollbar configuration
 * @returns Thumb start position and size
 */
export function calculateThumb(
  trackSize: number,
  state: ScrollbarState,
  config?: ScrollbarConfig,
): { start: number; size: number } {
  const minThumbSize = config?.minThumbSize ?? 1;
  const showArrows = config?.showArrows ?? false;

  // Adjust track size for arrows
  const effectiveTrackSize = showArrows ? trackSize - 2 : trackSize;

  if (effectiveTrackSize <= minThumbSize || state.viewportRatio >= 1) {
    // Content fits, no scrolling needed
    return { start: 0, size: effectiveTrackSize };
  }

  // Calculate thumb size proportional to viewport
  const rawThumbSize = Math.floor(effectiveTrackSize * state.viewportRatio);
  const thumbSize = Math.max(minThumbSize, rawThumbSize);

  // Calculate available scroll range
  const scrollableTrack = effectiveTrackSize - thumbSize;
  const thumbStart = Math.floor(scrollableTrack * state.position);

  // Add offset for top arrow
  const offset = showArrows ? 1 : 0;

  return {
    start: offset + thumbStart,
    size: thumbSize,
  };
}

/**
 * Render a vertical scrollbar to a character array.
 *
 * @param height - Height of the scrollbar in cells
 * @param state - Current scrollbar state
 * @param config - Scrollbar configuration
 * @returns Array of characters for each cell
 */
export function renderVerticalScrollbar(
  height: number,
  state: ScrollbarState,
  config?: ScrollbarConfig,
): readonly string[] {
  const glyphs = config?.glyphs ?? SCROLLBAR_MINIMAL;
  const showArrows = config?.showArrows ?? false;
  const result: string[] = [];

  if (height <= 0) return result;

  const { start, size } = calculateThumb(height, state, config);

  for (let i = 0; i < height; i++) {
    if (showArrows && i === 0 && glyphs.arrowUp) {
      result.push(glyphs.arrowUp);
    } else if (showArrows && i === height - 1 && glyphs.arrowDown) {
      result.push(glyphs.arrowDown);
    } else if (i >= start && i < start + size) {
      result.push(glyphs.thumb);
    } else {
      result.push(glyphs.track);
    }
  }

  return result;
}

/**
 * Render a horizontal scrollbar to a character array.
 *
 * @param width - Width of the scrollbar in cells
 * @param state - Current scrollbar state
 * @param config - Scrollbar configuration
 * @returns Array of characters for each cell
 */
export function renderHorizontalScrollbar(
  width: number,
  state: ScrollbarState,
  config?: ScrollbarConfig,
): readonly string[] {
  const glyphs = config?.glyphs ?? SCROLLBAR_MINIMAL;
  const showArrows = config?.showArrows ?? false;
  const result: string[] = [];

  if (width <= 0) return result;

  const { start, size } = calculateThumb(width, state, config);

  for (let i = 0; i < width; i++) {
    if (showArrows && i === 0 && glyphs.arrowLeft) {
      result.push(glyphs.arrowLeft);
    } else if (showArrows && i === width - 1 && glyphs.arrowRight) {
      result.push(glyphs.arrowRight);
    } else if (i >= start && i < start + size) {
      result.push(glyphs.thumb);
    } else {
      result.push(glyphs.track);
    }
  }

  return result;
}

/**
 * Default scrollbar configurations per variant.
 */
export const SCROLLBAR_CONFIGS: Record<ScrollbarVariant, ScrollbarConfig> = {
  minimal: {
    width: 1,
    height: 1,
    showArrows: false,
    minThumbSize: 1,
    glyphs: SCROLLBAR_MINIMAL,
  },
  classic: {
    width: 1,
    height: 1,
    showArrows: true,
    minThumbSize: 2,
    glyphs: SCROLLBAR_CLASSIC,
  },
  modern: {
    width: 1,
    height: 1,
    showArrows: false,
    minThumbSize: 1,
    glyphs: SCROLLBAR_MODERN,
  },
  dots: {
    width: 1,
    height: 1,
    showArrows: false,
    minThumbSize: 1,
    glyphs: SCROLLBAR_DOTS,
  },
  thin: {
    width: 1,
    height: 1,
    showArrows: false,
    minThumbSize: 1,
    glyphs: SCROLLBAR_THIN,
  },
};
