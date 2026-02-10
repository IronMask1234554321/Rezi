import { type VNode, ui } from "@rezi-ui/core";
import type React from "react";
import reconciler, { type HostRoot } from "../reconciler.js";

/**
 * Render a React element into a Rezi VNode using the ink-compat reconciler.
 *
 * This does not start a Rezi app/backend; it just runs the React commit pipeline.
 */
export function renderToVNode(element: React.ReactNode): VNode {
  let last: VNode | null = null;

  const root: HostRoot = {
    kind: "root",
    children: [],
    staticVNodes: [],
    onCommit(vnode) {
      last = vnode;
    },
  };

  const container = reconciler.createContainer(root, 0, null, false, null, "id", () => {}, null);
  reconciler.updateContainer(element, container, null, () => {});

  return last ?? ui.text("");
}
