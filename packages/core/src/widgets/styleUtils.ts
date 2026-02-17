/**
 * packages/core/src/widgets/styleUtils.ts — Style helpers.
 *
 * Why: Provides small, deterministic helpers for composing TextStyle objects.
 */

import type { TextStyle } from "./style.js";

/**
 * Merge multiple styles; later styles override earlier.
 */
export function mergeStyles(...styles: (TextStyle | undefined)[]): TextStyle {
  let out: TextStyle = {};
  for (const s of styles) {
    if (!s) continue;
    out = { ...out, ...s };
  }
  return out;
}

/**
 * Extend a base style with overrides.
 */
export function extendStyle(base: TextStyle, overrides: TextStyle): TextStyle {
  return mergeStyles(base, overrides);
}

/**
 * Conditional style selection.
 */
export function styleWhen<T extends TextStyle>(
  condition: boolean,
  trueStyle: T,
  falseStyle?: T,
): T | undefined {
  if (condition) return trueStyle;
  return falseStyle;
}

/**
 * Style presets.
 */
export const styles = {
  bold: { bold: true } as const,
  dim: { dim: true } as const,
  italic: { italic: true } as const,
  underline: { underline: true } as const,
  inverse: { inverse: true } as const,
  strikethrough: { strikethrough: true } as const,
} as const;
