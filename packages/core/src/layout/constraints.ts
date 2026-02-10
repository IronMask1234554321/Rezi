/**
 * packages/core/src/layout/constraints.ts — Constraint resolution helpers.
 *
 * Why: Converts user-facing constraint values (numbers, percentages, "auto")
 * into concrete cell sizes for a given parent rectangle.
 */

import type { LayoutConstraints, Rect, SizeConstraint } from "./types.js";

export type ResolvedConstraints = Readonly<{
  width: number | null;
  height: number | null;
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
  flex: number;
  aspectRatio: number | null;
}>;

/**
 * Resolve a single size constraint to a concrete cell count relative to `parentSize`.
 *
 * - numbers are returned as-is
 * - percentages are floored to an integer cell count
 * - "auto" resolves to `NaN` (caller decides meaning)
 */
export function resolveConstraint(value: SizeConstraint, parentSize: number): number {
  if (value === "auto") return Number.NaN;
  if (typeof value === "number") return value;
  const raw = Number.parseFloat(value.slice(0, -1));
  if (!Number.isFinite(raw)) return Number.NaN;
  return Math.floor((parentSize * raw) / 100);
}

function resolveOptional(value: SizeConstraint | undefined, parentSize: number): number | null {
  if (value === undefined) return null;
  const n = resolveConstraint(value, parentSize);
  return Number.isFinite(n) ? (n as number) : null;
}

function or0(n: number | undefined): number {
  return n === undefined ? 0 : n;
}

function orInf(n: number | undefined): number {
  return n === undefined ? Number.POSITIVE_INFINITY : n;
}

export function resolveLayoutConstraints(
  props: LayoutConstraints,
  parent: Rect,
): ResolvedConstraints {
  let width = resolveOptional(props.width, parent.w);
  let height = resolveOptional(props.height, parent.h);

  const aspectRatio =
    props.aspectRatio === undefined || props.aspectRatio === null ? null : props.aspectRatio;

  if (aspectRatio !== null && Number.isFinite(aspectRatio) && aspectRatio > 0) {
    if (width !== null && height === null) height = Math.floor(width / aspectRatio);
    else if (height !== null && width === null) width = Math.floor(height * aspectRatio);
  }

  return {
    width,
    height,
    minWidth: or0(props.minWidth),
    maxWidth: orInf(props.maxWidth),
    minHeight: or0(props.minHeight),
    maxHeight: orInf(props.maxHeight),
    flex: props.flex === undefined ? 0 : props.flex,
    aspectRatio,
  };
}
