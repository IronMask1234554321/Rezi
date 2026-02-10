/**
 * packages/core/src/cursor/cursorState.ts — Framework-level cursor state management.
 *
 * Why: Provides a unified cursor state API that widgets can drive. The cursor
 * state is resolved per-frame and emitted as a SET_CURSOR command in v2 drawlists.
 * When v2 is enabled, the engine displays the cursor natively, eliminating the
 * need for "fake cursor" glyphs.
 *
 * Resolution policy:
 *   - Single desired cursor state per frame
 *   - Last writer wins (widgets called later in render override earlier ones)
 *   - Focused input widgets automatically request cursor at their position
 *   - Explicit hide() clears the cursor regardless of prior requests
 *
 * @see docs/protocol/abi.md
 */

import type { CursorShape } from "../abi.js";
import type { CursorState } from "../drawlist/types.js";

/**
 * Cursor request from a widget.
 *
 * A widget can request:
 *   - show: Display cursor at position with given shape/blink
 *   - hide: Hide cursor regardless of previous requests
 */
export type CursorRequest =
  | Readonly<{
      kind: "show";
      x: number;
      y: number;
      shape: CursorShape;
      blink: boolean;
    }>
  | Readonly<{ kind: "hide" }>;

/**
 * Cursor state collector for a single frame.
 *
 * Widgets call request() during render to set cursor state.
 * The final state is resolved via resolve() after rendering.
 */
export interface CursorStateCollector {
  /** Request cursor to be shown at position with given appearance. */
  request(req: CursorRequest): void;

  /** Get the resolved cursor state after all widget requests. */
  resolve(): CursorState | null;

  /** Reset for next frame. */
  reset(): void;
}

/**
 * Create a new cursor state collector.
 *
 * @param defaultShape - Default cursor shape if not specified (default: block)
 * @param defaultBlink - Default blink state (default: true)
 */
export function createCursorStateCollector(
  defaultShape: CursorShape = 0,
  defaultBlink = true,
): CursorStateCollector {
  let lastRequest: CursorRequest | null = null;

  return {
    request(req: CursorRequest): void {
      lastRequest = req;
    },

    resolve(): CursorState | null {
      if (lastRequest === null) {
        // No cursor requests this frame
        return null;
      }

      if (lastRequest.kind === "hide") {
        return {
          x: -1,
          y: -1,
          shape: defaultShape,
          visible: false,
          blink: false,
        };
      }

      return {
        x: lastRequest.x,
        y: lastRequest.y,
        shape: lastRequest.shape,
        visible: true,
        blink: lastRequest.blink,
      };
    },

    reset(): void {
      lastRequest = null;
    },
  };
}

/**
 * Compute cursor position for a text input widget.
 *
 * @param inputX - X position of the input field
 * @param inputY - Y position of the input field
 * @param cursorOffset - Character offset of cursor within the input value
 * @param prefix - Optional prefix before the editable area (e.g., label)
 * @returns Cursor position in screen coordinates
 */
export function computeInputCursorPosition(
  inputX: number,
  inputY: number,
  cursorOffset: number,
  prefix = 0,
): Readonly<{ x: number; y: number }> {
  return {
    x: inputX + prefix + cursorOffset,
    y: inputY,
  };
}

/**
 * Default cursor shapes for different contexts.
 */
export const CURSOR_DEFAULTS = Object.freeze({
  /** Input field cursor (blinking bar) */
  input: { shape: 2 as CursorShape, blink: true },
  /** Selection cursor (blinking block) */
  selection: { shape: 0 as CursorShape, blink: true },
  /** Static cursor (non-blinking underline) */
  staticUnderline: { shape: 1 as CursorShape, blink: false },
});
