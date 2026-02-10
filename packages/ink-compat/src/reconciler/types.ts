import type { VNode } from "@rezi-ui/core";

export type HostType = "ink-box" | "ink-text" | "ink-virtual-text" | "ink-spacer";

export type HostText = {
  kind: "text";
  text: string;
};

export type HostElement = {
  kind: "element";
  type: HostType;
  props: Record<string, unknown>;
  children: Array<HostElement | HostText>;
};

export type HostNode = HostElement | HostText;

export type HostRoot = {
  kind: "root";
  children: Array<HostElement | HostText>;
  /**
   * Persistent static output (Ink `<Static>` semantics).
   * Items are appended on each commit and remain for the lifetime of the render() root.
   */
  staticVNodes: VNode[];
  onCommit: (vnode: VNode | null) => void;
};

export type HostContext = Readonly<{ isInsideText: boolean }>;

export function appendChildNode(
  parent: HostRoot | HostElement,
  child: HostElement | HostText,
): void {
  parent.children.push(child);
}

export function insertBeforeNode(
  parent: HostRoot | HostElement,
  child: HostElement | HostText,
  before: HostElement | HostText,
): void {
  const idx = parent.children.indexOf(before);
  if (idx < 0) {
    parent.children.push(child);
    return;
  }
  parent.children.splice(idx, 0, child);
}

export function removeChildNode(
  parent: HostRoot | HostElement,
  child: HostElement | HostText,
): void {
  const idx = parent.children.indexOf(child);
  if (idx < 0) return;
  parent.children.splice(idx, 1);
}
