import type { LayoutTree } from "../../layout/layout.js";
import type { Rect } from "../../layout/types.js";
import type { RuntimeInstance } from "../../runtime/commit.js";
import type { InstanceId } from "../../runtime/instance.js";

export type LayoutIndex = ReadonlyMap<InstanceId, Rect>;
export type IdRectIndex = ReadonlyMap<string, Rect>;
const ZERO_RECT: Rect = Object.freeze({ x: 0, y: 0, w: 0, h: 0 });

export function isVisibleRect(r: Rect): boolean {
  return r.w > 0 && r.h > 0;
}

export function indexLayoutRects(
  layoutRoot: LayoutTree,
  runtimeRoot: RuntimeInstance,
): LayoutIndex {
  const m = new Map<InstanceId, Rect>();
  const layoutStack: LayoutTree[] = [layoutRoot];
  const runtimeStack: RuntimeInstance[] = [runtimeRoot];

  while (layoutStack.length > 0 && runtimeStack.length > 0) {
    const layoutNode = layoutStack.pop();
    const runtimeNode = runtimeStack.pop();
    if (!layoutNode || !runtimeNode) continue;
    m.set(runtimeNode.instanceId, layoutNode.rect);

    const childCount = Math.min(layoutNode.children.length, runtimeNode.children.length);
    for (let i = childCount - 1; i >= 0; i--) {
      const layoutChild = layoutNode.children[i];
      const runtimeChild = runtimeNode.children[i];
      if (layoutChild && runtimeChild) {
        layoutStack.push(layoutChild);
        runtimeStack.push(runtimeChild);
      }
    }
  }

  return m;
}

export function indexIdRects(root: RuntimeInstance, layoutIndex: LayoutIndex): IdRectIndex {
  const m = new Map<string, Rect>();
  const stack: RuntimeInstance[] = [root];
  while (stack.length > 0) {
    const node = stack.pop();
    if (!node) continue;

    const vnode = node.vnode;
    const id = (vnode as { props?: { id?: unknown } }).props?.id;
    if (typeof id === "string" && id.length > 0) {
      m.set(id, getRect(layoutIndex, node.instanceId));
    }

    for (let i = node.children.length - 1; i >= 0; i--) {
      const c = node.children[i];
      if (c) stack.push(c);
    }
  }
  return m;
}

export function getRect(index: LayoutIndex, instanceId: InstanceId): Rect {
  return index.get(instanceId) ?? ZERO_RECT;
}
