import { isSpacingKey, resolveSpacingValue } from "../../layout/spacing-scale.js";

type ResolvedSpacing = Readonly<{ top: number; right: number; bottom: number; left: number }>;

export function clampNonNegative(n: number): number {
  return n < 0 ? 0 : n;
}

/**
 * Read a spacing value (number or scale key) and resolve to non-negative integer.
 */
export function readSpacingValue(v: unknown, def: number): number {
  if (typeof v === "string" && isSpacingKey(v)) {
    return resolveSpacingValue(v);
  }
  if (typeof v !== "number" || !Number.isInteger(v) || v < 0) return def;
  return v;
}

/**
 * Read an optional spacing value.
 */
export function readOptionalSpacingValue(v: unknown): number | undefined {
  if (typeof v === "string" && isSpacingKey(v)) {
    return resolveSpacingValue(v);
  }
  if (typeof v !== "number" || !Number.isInteger(v) || v < 0) return undefined;
  return v;
}

// Legacy aliases for backwards compatibility
export const readIntNonNegative = readSpacingValue;
export const readOptionalIntNonNegative = readOptionalSpacingValue;

export function resolveSpacingFromProps(props: {
  pad?: unknown;
  p?: unknown;
  px?: unknown;
  py?: unknown;
  pt?: unknown;
  pb?: unknown;
  pl?: unknown;
  pr?: unknown;
}): ResolvedSpacing {
  const pad = readSpacingValue(props.pad, 0);
  const p = readOptionalSpacingValue(props.p) ?? pad;
  const px = readOptionalSpacingValue(props.px) ?? p;
  const py = readOptionalSpacingValue(props.py) ?? p;

  return {
    top: readOptionalSpacingValue(props.pt) ?? py,
    right: readOptionalSpacingValue(props.pr) ?? px,
    bottom: readOptionalSpacingValue(props.pb) ?? py,
    left: readOptionalSpacingValue(props.pl) ?? px,
  };
}

export function resolveMarginFromProps(props: {
  m?: unknown;
  mx?: unknown;
  my?: unknown;
}): ResolvedSpacing {
  const m = readOptionalSpacingValue(props.m) ?? 0;
  const mx = readOptionalSpacingValue(props.mx) ?? m;
  const my = readOptionalSpacingValue(props.my) ?? m;
  return {
    top: my,
    right: mx,
    bottom: my,
    left: mx,
  };
}
