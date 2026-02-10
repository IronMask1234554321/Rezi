import type { VNode } from "../../index.js";
import { computePanelCellSizes } from "../../widgets/splitPane.js";
import { clampNonNegative, toFiniteMax } from "../engine/bounds.js";
import { ok } from "../engine/result.js";
import type { LayoutTree } from "../engine/types.js";
import type { Axis, Size } from "../types.js";
import type { LayoutResult } from "../validateProps.js";

type LayoutNodeFn = (
  vnode: VNode,
  x: number,
  y: number,
  maxW: number,
  maxH: number,
  axis: Axis,
  forcedW?: number | null,
  forcedH?: number | null,
) => LayoutResult<LayoutTree>;

export function measureSplitPaneKinds(
  vnode: VNode,
  maxW: number,
  maxH: number,
): LayoutResult<Size> {
  switch (vnode.kind) {
    case "splitPane": {
      // Split pane container: fills available space
      return ok({ w: maxW, h: maxH });
    }
    case "panelGroup": {
      // Panel group container: fills available space
      return ok({ w: maxW, h: maxH });
    }
    case "resizablePanel": {
      // Resizable panel: fills available space
      return ok({ w: maxW, h: maxH });
    }
    default:
      return {
        ok: false,
        fatal: {
          code: "ZRUI_INVALID_PROPS",
          detail: "measureSplitPaneKinds: unexpected vnode kind",
        },
      };
  }
}

export function layoutSplitPaneKinds(
  vnode: VNode,
  x: number,
  y: number,
  maxW: number,
  maxH: number,
  rectW: number,
  rectH: number,
  axis: Axis,
  layoutNode: LayoutNodeFn,
): LayoutResult<LayoutTree> {
  switch (vnode.kind) {
    case "splitPane": {
      // Split pane: layout children according to direction and sizes
      const { direction, sizes } = vnode.props;
      const dividerSize = clampNonNegative(
        Math.trunc(toFiniteMax(vnode.props.dividerSize ?? 1, 1)),
      );
      const childCount = vnode.children.length;
      if (childCount === 0) {
        return ok({ vnode, rect: { x, y, w: rectW, h: rectH }, children: Object.freeze([]) });
      }

      const sizeMode = vnode.props.sizeMode ?? "percent";
      const available = direction === "horizontal" ? rectW : rectH;
      const panelSizes = computePanelCellSizes(
        childCount,
        sizes,
        available,
        sizeMode,
        dividerSize,
        vnode.props.minSizes,
        vnode.props.maxSizes,
      ).sizes;

      const childTrees: LayoutTree[] = [];
      let offset = 0;

      for (let i = 0; i < childCount; i++) {
        const child = vnode.children[i];
        if (!child) continue;
        const panelSize = panelSizes[i] ?? 0;

        const childX = direction === "horizontal" ? x + offset : x;
        const childY = direction === "vertical" ? y + offset : y;
        const childW = direction === "horizontal" ? panelSize : rectW;
        const childH = direction === "vertical" ? panelSize : rectH;

        const childRes = layoutNode(child, childX, childY, childW, childH, axis);
        if (!childRes.ok) return childRes;
        childTrees.push(childRes.value);

        offset += panelSize + (i < childCount - 1 ? dividerSize : 0);
      }

      return ok({ vnode, rect: { x, y, w: rectW, h: rectH }, children: Object.freeze(childTrees) });
    }
    case "panelGroup": {
      // Panel group: similar to splitPane but with children as panels
      const childCount = vnode.children.length;
      if (childCount === 0) {
        return ok({ vnode, rect: { x, y, w: rectW, h: rectH }, children: Object.freeze([]) });
      }

      const { direction } = vnode.props;
      const childTrees: LayoutTree[] = [];
      const total = direction === "horizontal" ? rectW : rectH;
      const basePanelSize = Math.floor(total / childCount);
      const remainder = total - basePanelSize * childCount;

      let offset = 0;
      for (let i = 0; i < childCount; i++) {
        const child = vnode.children[i];
        if (!child) continue;
        // Distribute remainder cells one each to the first `remainder` panels
        const panelSize = basePanelSize + (i < remainder ? 1 : 0);

        const childX = direction === "horizontal" ? x + offset : x;
        const childY = direction === "vertical" ? y + offset : y;
        const childW = direction === "horizontal" ? panelSize : rectW;
        const childH = direction === "vertical" ? panelSize : rectH;

        const childRes = layoutNode(child, childX, childY, childW, childH, axis);
        if (!childRes.ok) return childRes;
        childTrees.push(childRes.value);

        offset += panelSize;
      }

      return ok({ vnode, rect: { x, y, w: rectW, h: rectH }, children: Object.freeze(childTrees) });
    }
    case "resizablePanel": {
      // Resizable panel: layout single child within bounds
      if (vnode.children.length === 0) {
        return ok({ vnode, rect: { x, y, w: rectW, h: rectH }, children: Object.freeze([]) });
      }
      const child = vnode.children[0];
      if (!child) {
        return ok({ vnode, rect: { x, y, w: rectW, h: rectH }, children: Object.freeze([]) });
      }
      const childRes = layoutNode(child, x, y, rectW, rectH, axis);
      if (!childRes.ok) return childRes;
      return ok({
        vnode,
        rect: { x, y, w: rectW, h: rectH },
        children: Object.freeze([childRes.value]),
      });
    }
    default:
      return {
        ok: false,
        fatal: {
          code: "ZRUI_INVALID_PROPS",
          detail: "layoutSplitPaneKinds: unexpected vnode kind",
        },
      };
  }
}
