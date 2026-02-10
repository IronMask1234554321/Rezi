import type { LayoutResult } from "../validateProps.js";

export function ok<T>(value: T): LayoutResult<T> {
  return { ok: true, value };
}
