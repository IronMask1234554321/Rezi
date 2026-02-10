import type { VNode } from "../../index.js";
import type { Rect } from "../types.js";

/**
 * Tree of layout results mirroring VNode structure.
 * Each node contains its positioned rectangle and children.
 */
export type LayoutTree = Readonly<{ vnode: VNode; rect: Rect; children: readonly LayoutTree[] }>;
