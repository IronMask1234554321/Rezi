import type { VNode } from "../../index.js";
import type { Axis } from "../types.js";
import { isPercentString } from "./bounds.js";

type ConstraintPropsBag = Readonly<{ width?: unknown; height?: unknown; flex?: unknown }>;

export function isVNode(v: unknown): v is VNode {
  return typeof v === "object" && v !== null && "kind" in v;
}

export function getConstraintProps(vnode: VNode): ConstraintPropsBag | null {
  if (vnode.kind === "box" || vnode.kind === "row" || vnode.kind === "column") {
    return vnode.props as ConstraintPropsBag;
  }
  return null;
}

export function childHasFlexInMainAxis(vnode: VNode, axis: Axis): boolean {
  if (vnode.kind === "spacer") {
    const flex = (vnode.props as { flex?: unknown }).flex;
    return typeof flex === "number" && Number.isFinite(flex) && flex > 0;
  }
  const p = getConstraintProps(vnode);
  if (!p) return false;
  const flex = p.flex;
  return typeof flex === "number" && Number.isFinite(flex) && flex > 0;
}

export function childHasPercentInMainAxis(vnode: VNode, axis: Axis): boolean {
  const p = getConstraintProps(vnode);
  if (!p) return false;
  const main = axis === "row" ? p.width : p.height;
  return isPercentString(main);
}

export function childHasPercentInCrossAxis(vnode: VNode, axis: Axis): boolean {
  const p = getConstraintProps(vnode);
  if (!p) return false;
  const cross = axis === "row" ? p.height : p.width;
  return isPercentString(cross);
}
