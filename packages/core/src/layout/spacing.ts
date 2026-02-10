/**
 * packages/core/src/layout/spacing.ts — Directional spacing resolution.
 *
 * Why: Normalizes spacing shorthand props into concrete per-side values.
 * Supports both numeric values and spacing scale keys ("xs", "md", etc.).
 */

import type { SpacingProps } from "../widgets/types.js";
import { type SpacingValue, resolveSpacingValue } from "./spacing-scale.js";

export type ResolvedSpacing = Readonly<{
  top: number;
  right: number;
  bottom: number;
  left: number;
}>;

export type ResolvedMargin = ResolvedSpacing;

/**
 * Resolve spacing props to concrete numeric values.
 * Priority: specific (pt) > axis (py) > all (p) > legacy (pad)
 *
 * @param props - Spacing props with values that may be numbers or scale keys
 * @returns Resolved spacing in cell units
 *
 * @example
 * ```typescript
 * resolveSpacing({ p: "md" })
 * // { top: 2, right: 2, bottom: 2, left: 2 }
 *
 * resolveSpacing({ px: "lg", py: "sm" })
 * // { top: 1, right: 3, bottom: 1, left: 3 }
 *
 * resolveSpacing({ p: 1, pt: "xl" })
 * // { top: 4, right: 1, bottom: 1, left: 1 }
 * ```
 */
export function resolveSpacing(props: SpacingProps & { pad?: SpacingValue }): ResolvedSpacing {
  // Resolve base padding (p or deprecated pad)
  const p = resolveSpacingValue(props.p ?? props.pad);

  // Resolve axis-specific padding, falling back to base
  const px = props.px !== undefined ? resolveSpacingValue(props.px) : p;
  const py = props.py !== undefined ? resolveSpacingValue(props.py) : p;

  // Resolve side-specific padding, falling back to axis
  const top = props.pt !== undefined ? resolveSpacingValue(props.pt) : py;
  const right = props.pr !== undefined ? resolveSpacingValue(props.pr) : px;
  const bottom = props.pb !== undefined ? resolveSpacingValue(props.pb) : py;
  const left = props.pl !== undefined ? resolveSpacingValue(props.pl) : px;

  return Object.freeze({ top, right, bottom, left });
}

/**
 * Resolve margin props to concrete numeric values.
 * Priority: specific (mt/mr/mb/ml) > axis (mx/my) > all (m)
 *
 * @param props - Spacing props with margin values that may be numbers or scale keys
 * @returns Resolved margin in cell units
 */
export function resolveMargin(props: SpacingProps): ResolvedMargin {
  const m = resolveSpacingValue(props.m);
  const mx = props.mx !== undefined ? resolveSpacingValue(props.mx) : m;
  const my = props.my !== undefined ? resolveSpacingValue(props.my) : m;

  const top = props.mt !== undefined ? resolveSpacingValue(props.mt) : my;
  const right = props.mr !== undefined ? resolveSpacingValue(props.mr) : mx;
  const bottom = props.mb !== undefined ? resolveSpacingValue(props.mb) : my;
  const left = props.ml !== undefined ? resolveSpacingValue(props.ml) : mx;

  return Object.freeze({ top, right, bottom, left });
}
