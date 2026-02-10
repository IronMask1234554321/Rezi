/**
 * packages/core/src/widgets/collections.ts — Collection helpers.
 */

import type { VNode } from "./types.js";

export type EachOptions<T> = Readonly<{
  key: (item: T, index: number) => string;
  empty?: () => VNode;
}>;

export function each<T>(
  items: readonly T[],
  render: (item: T, index: number) => VNode,
  options: EachOptions<T>,
): VNode {
  if (items.length === 0 && options.empty) {
    return options.empty();
  }

  const children: VNode[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item === undefined) continue;
    const node = render(item, i);
    children.push(injectKey(node, options.key(item, i)));
  }

  return { kind: "column", props: {}, children: Object.freeze(children) };
}

function injectKey(node: VNode, key: string): VNode {
  switch (node.kind) {
    case "text":
      return { ...node, props: { ...node.props, key } };
    case "box":
    case "row":
    case "column":
    case "spacer":
    case "divider":
    case "button":
    case "input":
    case "focusZone":
    case "focusTrap":
    case "virtualList":
    case "layers":
    case "modal":
    case "dropdown":
    case "layer":
    case "table":
    case "tree":
    case "field":
    case "select":
    case "checkbox":
    case "radioGroup":
      return {
        ...node,
        props: { ...(node as { props: Record<string, unknown> }).props, key },
      } as VNode;
  }

  return node;
}
