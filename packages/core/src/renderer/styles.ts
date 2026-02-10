/**
 * packages/core/src/renderer/styles.ts — Renderer style utilities.
 *
 * Why: Provides style computation for widget rendering, including focus
 * and disabled visual states. Deterministic style mapping ensures
 * consistent visual output across renders.
 *
 * @see docs/styling/style-props.md
 * @see docs/styling/focus-styles.md
 */

import type { Rgb, TextStyle } from "../index.js";

/** Disabled widget foreground color (gray). */
const DISABLED_FG: Rgb = Object.freeze({ r: 128, g: 128, b: 128 });

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

/**
 * Coerce unknown value to TextStyle if object-shaped.
 * Relies on drawlist builder for validation.
 */
export function asTextStyle(v: unknown): TextStyle | undefined {
  /* Renderer is not responsible for validating user-provided style objects.
   * Accept object-shaped values and rely on the drawlist builder's deterministic encoding. */
  if (!isObject(v)) return undefined;
  return v as TextStyle;
}

/** Visual state for button/input styling. */
export type ButtonVisualState = Readonly<{ focused: boolean; disabled: boolean }>;

/**
 * Compute text style for button/input label based on visual state.
 *   - Focused: underline + bold for clear indication while maintaining readability
 *   - Disabled: gray foreground
 */
export function getButtonLabelStyle(state: ButtonVisualState): TextStyle | undefined {
  // Deterministic mapping:
  // - Focused: underline + bold (more readable than inverse)
  // - Disabled: deterministic fg color override (engine v1 has no "dim" attr)
  if (state.disabled) return { fg: DISABLED_FG };
  if (state.focused) return { underline: true, bold: true };
  return undefined;
}
