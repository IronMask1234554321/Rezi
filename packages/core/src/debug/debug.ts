/**
 * packages/core/src/debug/debug.ts — UI-level debug helpers.
 *
 * Why: Lightweight helpers for instrumenting widget trees during development.
 * These are pure factories and do not perform I/O.
 */

import type { VNode } from "../widgets/types.js";
import { ui } from "../widgets/ui.js";

export function debug(node: VNode, options?: { showId?: boolean }): VNode {
  const id = getNodeId(node);
  const label = options?.showId !== false && id ? ` ${id} ` : "";

  return ui.box(
    {
      border: "single",
      title: label,
    },
    [node],
  );
}

export function inspect(value: unknown, options?: { depth?: number }): VNode {
  const text = formatValue(value, options?.depth ?? 3, 0);
  return ui.text(text, { style: { dim: true } });
}

function formatValue(value: unknown, maxDepth: number, depth: number): string {
  if (depth > maxDepth) return "...";

  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "string") return `"${value}"`;
  if (typeof value === "number" || typeof value === "boolean") return String(value);

  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    const items = value.map((v) => formatValue(v, maxDepth, depth + 1));
    return `[${items.join(", ")}]`;
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return "{}";
    const pairs = entries.map(([k, v]) => `${k}: ${formatValue(v, maxDepth, depth + 1)}`);
    return `{ ${pairs.join(", ")} }`;
  }

  return String(value);
}

function getNodeId(node: VNode): string | null {
  if ("props" in node) {
    const id = (node as { props: { id?: unknown } }).props?.id;
    if (typeof id === "string") return id;
  }
  return null;
}
