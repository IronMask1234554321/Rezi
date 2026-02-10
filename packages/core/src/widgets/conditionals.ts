/**
 * packages/core/src/widgets/conditionals.ts — Conditional rendering helpers.
 */

import type { VNode } from "./types.js";

export function show(condition: boolean, node: VNode, fallback?: VNode): VNode | null {
  if (condition) return node;
  return fallback ?? null;
}

export function when(
  condition: boolean,
  trueBranch: () => VNode,
  falseBranch?: () => VNode,
): VNode | null {
  if (condition) return trueBranch();
  return falseBranch?.() ?? null;
}

export function match<T extends string | number>(
  value: T,
  cases: Partial<Record<T, (() => VNode) | VNode>> & Record<"_", (() => VNode) | VNode>,
): VNode | null {
  const handler = cases[value] ?? cases._;
  if (handler === undefined) return null;
  if (typeof handler === "function") return handler();
  return handler;
}

export function maybe<T>(value: T | null | undefined, render: (value: T) => VNode): VNode | null {
  if (value === null || value === undefined) return null;
  return render(value);
}
