import { type VNode, ui } from "@rezi-ui/core";

/** A single JSX child value accepted by Rezi container widgets. */
export type JsxChild = VNode | string | number | boolean | null | undefined;

/** Recursive JSX children shape, including nested arrays from maps. */
export type JsxChildren = JsxChild | readonly JsxChildren[];

/** Text-only JSX child value accepted by the Text component. */
export type JsxTextChild = string | number | boolean | null | undefined;

/** Recursive text-only children shape for Text component interpolation. */
export type JsxTextChildren = JsxTextChild | readonly JsxTextChildren[];

function isVNode(value: JsxChildren): value is VNode {
  return typeof value === "object" && value !== null && !Array.isArray(value) && "kind" in value;
}

function appendContainerChild(value: JsxChildren | undefined, out: VNode[]): void {
  if (value === undefined || value === null || value === false || value === true) {
    return;
  }

  if (Array.isArray(value)) {
    for (const nested of value) {
      appendContainerChild(nested, out);
    }
    return;
  }

  if (typeof value === "string" || typeof value === "number") {
    out.push(ui.text(String(value)));
    return;
  }

  if (isVNode(value)) {
    out.push(value);
  }
}

function appendTextChild(value: JsxTextChildren | undefined, out: string[]): void {
  if (value === undefined || value === null || value === false || value === true) {
    return;
  }

  if (Array.isArray(value)) {
    for (const nested of value) {
      appendTextChild(nested, out);
    }
    return;
  }

  out.push(String(value));
}

/**
 * Normalize JSX children for container widgets.
 *
 * Behavior:
 * - Flattens nested arrays
 * - Filters booleans/null/undefined
 * - Wraps bare strings and numbers as `ui.text(...)` VNodes
 */
export function normalizeContainerChildren(children: JsxChildren | undefined): readonly VNode[] {
  const out: VNode[] = [];
  appendContainerChild(children, out);
  return out;
}

/**
 * Normalize JSX children for the Text widget by concatenating values into one string.
 *
 * Behavior:
 * - Flattens nested arrays
 * - Filters booleans/null/undefined
 * - Stringifies strings and numbers
 */
export function normalizeTextChildren(children: JsxTextChildren | undefined): string {
  const out: string[] = [];
  appendTextChild(children, out);
  return out.join("");
}
