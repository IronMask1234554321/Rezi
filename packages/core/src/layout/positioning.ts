/**
 * packages/core/src/layout/positioning.ts — Anchor-relative positioning for overlays.
 *
 * Why: Computes positions for dropdowns, tooltips, and other anchor-relative
 * elements. Handles edge flipping when content would overflow screen boundaries.
 *
 * Positioning concepts:
 *   - Anchor: The element to position relative to
 *   - Position: Where to place the overlay (below-start, above-end, etc.)
 *   - Flip: Automatically switch sides when near screen edge
 *   - Constraint: Keep overlay within viewport bounds
 *
 * @see docs/guide/layout.md (GitHub issue #117)
 */

import type { DropdownPosition } from "../widgets/types.js";
import type { Rect, Size } from "./types.js";

/* ========== Position Calculation ========== */

/**
 * Viewport constraints for positioning calculations.
 */
export type Viewport = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
}>;

/**
 * Result of position calculation.
 */
export type PositionResult = Readonly<{
  /** Computed position for the overlay. */
  rect: Rect;
  /** The actual position used (may differ from requested if flipped). */
  position: DropdownPosition;
  /** Whether the position was flipped horizontally. */
  flippedHorizontal: boolean;
  /** Whether the position was flipped vertically. */
  flippedVertical: boolean;
}>;

/**
 * Options for position calculation.
 */
export type PositionOptions = Readonly<{
  /** Anchor element rect. */
  anchor: Rect;
  /** Size of the overlay element. */
  overlaySize: Size;
  /** Desired position relative to anchor. */
  position: DropdownPosition;
  /** Viewport constraints. */
  viewport: Viewport;
  /** Gap between anchor and overlay (default: 0). */
  gap?: number;
  /** Whether to flip if near edge (default: true). */
  flip?: boolean;
}>;

/**
 * Parse position into vertical and horizontal components.
 */
function parsePosition(position: DropdownPosition): {
  vertical: "above" | "below";
  horizontal: "start" | "center" | "end";
} {
  const parts = position.split("-") as [string, string];
  return {
    vertical: parts[0] === "above" ? "above" : "below",
    horizontal: (parts[1] as "start" | "center" | "end") ?? "start",
  };
}

/**
 * Build position string from components.
 */
function buildPosition(
  vertical: "above" | "below",
  horizontal: "start" | "center" | "end",
): DropdownPosition {
  return `${vertical}-${horizontal}` as DropdownPosition;
}

/**
 * Calculate X position for horizontal alignment.
 */
function calculateX(
  anchor: Rect,
  overlayWidth: number,
  horizontal: "start" | "center" | "end",
): number {
  switch (horizontal) {
    case "start":
      return anchor.x;
    case "center":
      return anchor.x + Math.floor((anchor.w - overlayWidth) / 2);
    case "end":
      return anchor.x + anchor.w - overlayWidth;
  }
}

/**
 * Calculate Y position for vertical alignment.
 */
function calculateY(
  anchor: Rect,
  overlayHeight: number,
  vertical: "above" | "below",
  gap: number,
): number {
  switch (vertical) {
    case "above":
      return anchor.y - overlayHeight - gap;
    case "below":
      return anchor.y + anchor.h + gap;
  }
}

/**
 * Check if overlay would overflow viewport on the right.
 */
function overflowsRight(x: number, width: number, viewport: Viewport): boolean {
  return x + width > viewport.x + viewport.width;
}

/**
 * Check if overlay would overflow viewport on the left.
 */
function overflowsLeft(x: number, viewport: Viewport): boolean {
  return x < viewport.x;
}

/**
 * Check if overlay would overflow viewport on the bottom.
 */
function overflowsBottom(y: number, height: number, viewport: Viewport): boolean {
  return y + height > viewport.y + viewport.height;
}

/**
 * Check if overlay would overflow viewport on the top.
 */
function overflowsTop(y: number, viewport: Viewport): boolean {
  return y < viewport.y;
}

/**
 * Clamp a value to be within viewport bounds.
 */
function clampToViewport(
  value: number,
  size: number,
  viewportStart: number,
  viewportSize: number,
): number {
  const max = viewportStart + viewportSize - size;
  const min = viewportStart;
  return Math.max(min, Math.min(max, value));
}

/**
 * Calculate anchor-relative position for an overlay element.
 * Handles automatic flipping when the overlay would overflow the viewport.
 *
 * @param options - Position calculation options
 * @returns Computed position result
 *
 * @example
 * ```ts
 * const result = calculateAnchorPosition({
 *   anchor: { x: 10, y: 5, w: 20, h: 1 },
 *   overlaySize: { w: 30, h: 10 },
 *   position: "below-start",
 *   viewport: { x: 0, y: 0, width: 80, height: 24 },
 * });
 * // result.rect = { x: 10, y: 6, w: 30, h: 10 }
 * ```
 */
export function calculateAnchorPosition(options: PositionOptions): PositionResult {
  const { anchor, overlaySize, position, viewport, gap = 0, flip = true } = options;

  let { vertical, horizontal } = parsePosition(position);
  let flippedHorizontal = false;
  let flippedVertical = false;

  // Calculate initial position
  let x = calculateX(anchor, overlaySize.w, horizontal);
  let y = calculateY(anchor, overlaySize.h, vertical, gap);

  // Check for vertical overflow and flip if needed
  if (flip) {
    if (vertical === "below" && overflowsBottom(y, overlaySize.h, viewport)) {
      // Try flipping to above
      const aboveY = calculateY(anchor, overlaySize.h, "above", gap);
      if (!overflowsTop(aboveY, viewport)) {
        y = aboveY;
        vertical = "above";
        flippedVertical = true;
      }
    } else if (vertical === "above" && overflowsTop(y, viewport)) {
      // Try flipping to below
      const belowY = calculateY(anchor, overlaySize.h, "below", gap);
      if (!overflowsBottom(belowY, overlaySize.h, viewport)) {
        y = belowY;
        vertical = "below";
        flippedVertical = true;
      }
    }

    // Check for horizontal overflow and flip if needed
    if (horizontal === "start" && overflowsRight(x, overlaySize.w, viewport)) {
      // Try flipping to end
      const endX = calculateX(anchor, overlaySize.w, "end");
      if (!overflowsLeft(endX, viewport)) {
        x = endX;
        horizontal = "end";
        flippedHorizontal = true;
      }
    } else if (horizontal === "end" && overflowsLeft(x, viewport)) {
      // Try flipping to start
      const startX = calculateX(anchor, overlaySize.w, "start");
      if (!overflowsRight(startX, overlaySize.w, viewport)) {
        x = startX;
        horizontal = "start";
        flippedHorizontal = true;
      }
    }
  }

  // Clamp size to viewport bounds if overlay is larger than viewport
  const clampedW = Math.min(overlaySize.w, viewport.width);
  const clampedH = Math.min(overlaySize.h, viewport.height);

  // Clamp position to viewport bounds as final fallback
  x = clampToViewport(x, clampedW, viewport.x, viewport.width);
  y = clampToViewport(y, clampedH, viewport.y, viewport.height);

  return Object.freeze({
    rect: Object.freeze({
      x,
      y,
      w: clampedW,
      h: clampedH,
    }),
    position: buildPosition(vertical, horizontal),
    flippedHorizontal,
    flippedVertical,
  });
}

/* ========== Modal Centering ========== */

/**
 * Options for modal centering.
 */
export type CenterOptions = Readonly<{
  /** Size of the modal. */
  modalSize: Size;
  /** Viewport to center within. */
  viewport: Viewport;
}>;

/**
 * Calculate centered position for a modal.
 *
 * @param options - Centering options
 * @returns Rect for the centered modal
 */
export function calculateCenteredPosition(options: CenterOptions): Rect {
  const { modalSize, viewport } = options;

  const x = viewport.x + Math.floor((viewport.width - modalSize.w) / 2);
  const y = viewport.y + Math.floor((viewport.height - modalSize.h) / 2);

  // Ensure modal doesn't go negative
  return Object.freeze({
    x: Math.max(viewport.x, x),
    y: Math.max(viewport.y, y),
    w: Math.min(modalSize.w, viewport.width),
    h: Math.min(modalSize.h, viewport.height),
  });
}

/* ========== Anchor Lookup ========== */

/**
 * Anchor rect lookup function type.
 * Used to find the position of an anchor element by ID.
 */
export type AnchorLookup = (anchorId: string) => Rect | null;

/**
 * Create an anchor lookup from a layout rect map.
 *
 * @param layoutRects - Map of widget ID to rect
 * @returns Anchor lookup function
 */
export function createAnchorLookup(layoutRects: ReadonlyMap<string, Rect>): AnchorLookup {
  return (anchorId: string): Rect | null => {
    return layoutRects.get(anchorId) ?? null;
  };
}

/* ========== Modal Size Calculation ========== */

/**
 * Options for modal size calculation.
 */
export type ModalSizeOptions = Readonly<{
  /** Content size without padding/border. */
  contentSize: Size;
  /** Whether modal has a title bar. */
  hasTitle: boolean;
  /** Whether modal has action buttons. */
  hasActions: boolean;
  /** Explicit width override ("auto" uses content width). */
  width?: number | "auto";
  /** Maximum width constraint. */
  maxWidth?: number;
  /** Viewport width for percentage-based sizing. */
  viewportWidth: number;
}>;

/**
 * Calculate modal size including chrome (border, title, actions).
 */
export function calculateModalSize(options: ModalSizeOptions): Size {
  const { contentSize, hasTitle, hasActions, width, maxWidth, viewportWidth } = options;

  // Modal chrome: 1 cell border on each side
  const borderWidth = 2;
  const borderHeight = 2;

  // Title bar: 1 cell if present
  const titleHeight = hasTitle ? 1 : 0;

  // Action bar: 1 cell if present (plus 1 for separator)
  const actionsHeight = hasActions ? 2 : 0;

  // Calculate content area
  let modalWidth: number;
  if (typeof width === "number") {
    modalWidth = width;
  } else {
    // Auto width: use content width + padding
    modalWidth = contentSize.w + borderWidth + 2; // +2 for internal padding
  }

  // Apply max width constraint
  if (maxWidth !== undefined) {
    modalWidth = Math.min(modalWidth, maxWidth);
  }

  // Ensure fits in viewport (with some margin)
  modalWidth = Math.min(modalWidth, viewportWidth - 4);

  // Calculate total height
  const modalHeight = contentSize.h + borderHeight + titleHeight + actionsHeight;

  return Object.freeze({
    w: Math.max(modalWidth, 10), // Minimum width
    h: Math.max(modalHeight, 5), // Minimum height
  });
}
