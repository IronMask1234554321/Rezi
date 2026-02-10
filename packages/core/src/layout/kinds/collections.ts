import type { VNode } from "../../index.js";
import { ok } from "../engine/result.js";
import type { LayoutTree } from "../engine/types.js";
import type { Size } from "../types.js";
import type { LayoutResult } from "../validateProps.js";

export function measureCollections(vnode: VNode, maxW: number, maxH: number): LayoutResult<Size> {
  switch (vnode.kind) {
    case "virtualList": {
      // VirtualList fills available space to determine viewport.
      // It needs the full available dimensions to compute what items are visible.
      return ok({ w: maxW, h: maxH });
    }
    case "table": {
      // Tables take all available space (virtualized content).
      return ok({ w: maxW, h: maxH });
    }
    case "tree": {
      // Trees take all available space (virtualized content).
      return ok({ w: maxW, h: maxH });
    }
    case "filePicker": {
      // File picker: fills available space
      return ok({ w: maxW, h: maxH });
    }
    case "fileTreeExplorer": {
      // File tree: fills available space
      return ok({ w: maxW, h: maxH });
    }
    case "codeEditor": {
      // Code editor: fills available space
      return ok({ w: maxW, h: maxH });
    }
    case "diffViewer": {
      // Diff viewer: fills available space
      return ok({ w: maxW, h: maxH });
    }
    case "logsConsole": {
      // Logs console: fills available space
      return ok({ w: maxW, h: maxH });
    }
    default:
      return {
        ok: false,
        fatal: { code: "ZRUI_INVALID_PROPS", detail: "measureCollections: unexpected vnode kind" },
      };
  }
}

export function layoutCollections(
  vnode: VNode,
  x: number,
  y: number,
  rectW: number,
  rectH: number,
): LayoutResult<LayoutTree> {
  switch (vnode.kind) {
    case "table": {
      // Tables are rendered separately with virtualization.
      // Layout just establishes the container rect.
      return ok({ vnode, rect: { x, y, w: rectW, h: rectH }, children: Object.freeze([]) });
    }
    case "tree": {
      // Trees are rendered separately with virtualization.
      // Layout just establishes the container rect.
      return ok({ vnode, rect: { x, y, w: rectW, h: rectH }, children: Object.freeze([]) });
    }
    case "filePicker": {
      // File picker fills available space
      return ok({ vnode, rect: { x, y, w: rectW, h: rectH }, children: Object.freeze([]) });
    }
    case "fileTreeExplorer": {
      // File tree explorer fills available space
      return ok({ vnode, rect: { x, y, w: rectW, h: rectH }, children: Object.freeze([]) });
    }
    case "virtualList": {
      // VirtualList establishes the viewport rect.
      return ok({ vnode, rect: { x, y, w: rectW, h: rectH }, children: Object.freeze([]) });
    }
    case "codeEditor": {
      // Code editor fills available space
      return ok({ vnode, rect: { x, y, w: rectW, h: rectH }, children: Object.freeze([]) });
    }
    case "diffViewer": {
      // Diff viewer fills available space
      return ok({ vnode, rect: { x, y, w: rectW, h: rectH }, children: Object.freeze([]) });
    }
    case "logsConsole": {
      // Logs console fills available space
      return ok({ vnode, rect: { x, y, w: rectW, h: rectH }, children: Object.freeze([]) });
    }
    default:
      return {
        ok: false,
        fatal: { code: "ZRUI_INVALID_PROPS", detail: "layoutCollections: unexpected vnode kind" },
      };
  }
}
