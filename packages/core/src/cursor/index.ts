/**
 * packages/core/src/cursor/index.ts — Cursor state module public API.
 *
 * Why: Re-exports cursor state management types and utilities for external use.
 *
 * @see docs/protocol/abi.md
 */

export {
  createCursorStateCollector,
  computeInputCursorPosition,
  CURSOR_DEFAULTS,
  type CursorRequest,
  type CursorStateCollector,
} from "./cursorState.js";
