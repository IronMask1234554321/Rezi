import { assert, describe, test } from "@rezi-ui/testkit";
import type { VNode } from "../../index.js";
import { hitTestFocusable } from "../hitTest.js";
import type { LayoutTree } from "../layout.js";
import type { Rect } from "../types.js";

type OverflowMeta = Readonly<{
  scrollX: number;
  scrollY: number;
  contentWidth: number;
  contentHeight: number;
  viewportWidth: number;
  viewportHeight: number;
}>;

function buttonNode(id: string): VNode {
  return { kind: "button", props: { id, label: id } } as unknown as VNode;
}

function scrollRow(children: readonly VNode[], props: Readonly<Record<string, unknown>> = {}): VNode {
  return {
    kind: "row",
    props: { overflow: "scroll", ...props },
    children: Object.freeze([...children]),
  } as unknown as VNode;
}

function scrollColumn(
  children: readonly VNode[],
  props: Readonly<Record<string, unknown>> = {},
): VNode {
  return {
    kind: "column",
    props: { overflow: "scroll", ...props },
    children: Object.freeze([...children]),
  } as unknown as VNode;
}

function scrollBox(children: readonly VNode[], props: Readonly<Record<string, unknown>> = {}): VNode {
  return {
    kind: "box",
    props: { overflow: "scroll", ...props },
    children: Object.freeze([...children]),
  } as unknown as VNode;
}

function layoutNode(
  vnode: VNode,
  rect: Rect,
  children: readonly LayoutTree[] = [],
  meta?: unknown,
): LayoutTree {
  return {
    vnode,
    rect,
    children: Object.freeze([...children]),
    ...(meta === undefined ? {} : { meta }),
  } as LayoutTree;
}

function overflowMeta(
  scrollX: number,
  scrollY: number,
  contentWidth: number,
  contentHeight: number,
  viewportWidth: number,
  viewportHeight: number,
): OverflowMeta {
  return { scrollX, scrollY, contentWidth, contentHeight, viewportWidth, viewportHeight };
}

describe("scroll hit testing", () => {
  test("hits focusable child in horizontally scrolled viewport", () => {
    const leaf = buttonNode("btn");
    const root = scrollRow([leaf]);
    const tree = layoutNode(
      root,
      { x: 0, y: 0, w: 5, h: 4 },
      [layoutNode(leaf, { x: -4, y: 0, w: 9, h: 1 })],
      overflowMeta(4, 0, 9, 1, 5, 4),
    );

    assert.equal(hitTestFocusable(root, tree, 0, 0), "btn");
  });

  test("misses point left of scrolled child bounds", () => {
    const leaf = buttonNode("btn");
    const root = scrollRow([leaf]);
    const tree = layoutNode(
      root,
      { x: 0, y: 0, w: 5, h: 4 },
      [layoutNode(leaf, { x: -4, y: 0, w: 9, h: 1 })],
      overflowMeta(4, 0, 9, 1, 5, 4),
    );

    assert.equal(hitTestFocusable(root, tree, -1, 0), null);
  });

  test("hits focusable child in vertically scrolled viewport", () => {
    const leaf = buttonNode("btn");
    const root = scrollColumn([leaf]);
    const tree = layoutNode(
      root,
      { x: 0, y: 0, w: 4, h: 3 },
      [layoutNode(leaf, { x: 0, y: -2, w: 4, h: 3 })],
      overflowMeta(0, 2, 4, 5, 4, 3),
    );

    assert.equal(hitTestFocusable(root, tree, 1, 0), "btn");
  });

  test("misses point above clipped viewport after vertical scroll", () => {
    const leaf = buttonNode("btn");
    const root = scrollColumn([leaf]);
    const tree = layoutNode(
      root,
      { x: 0, y: 0, w: 4, h: 3 },
      [layoutNode(leaf, { x: 0, y: -2, w: 4, h: 3 })],
      overflowMeta(0, 2, 4, 5, 4, 3),
    );

    assert.equal(hitTestFocusable(root, tree, 1, -1), null);
  });

  test("vertical scrollbar gutter excludes hits", () => {
    const leaf = buttonNode("btn");
    const root = scrollRow([leaf]);
    const tree = layoutNode(
      root,
      { x: 0, y: 0, w: 5, h: 4 },
      [layoutNode(leaf, { x: 0, y: 0, w: 5, h: 4 })],
      overflowMeta(0, 0, 3, 10, 5, 4),
    );

    assert.equal(hitTestFocusable(root, tree, 4, 1), null);
  });

  test("horizontal scrollbar gutter excludes hits", () => {
    const leaf = buttonNode("btn");
    const root = scrollRow([leaf]);
    const tree = layoutNode(
      root,
      { x: 0, y: 0, w: 5, h: 4 },
      [layoutNode(leaf, { x: 0, y: 0, w: 5, h: 4 })],
      overflowMeta(0, 0, 10, 2, 5, 4),
    );

    assert.equal(hitTestFocusable(root, tree, 1, 3), null);
  });

  test("scrollbar corner cell excludes hits when both bars are visible", () => {
    const leaf = buttonNode("btn");
    const root = scrollRow([leaf]);
    const tree = layoutNode(
      root,
      { x: 0, y: 0, w: 5, h: 4 },
      [layoutNode(leaf, { x: 0, y: 0, w: 5, h: 4 })],
      overflowMeta(0, 0, 10, 10, 5, 4),
    );

    assert.equal(hitTestFocusable(root, tree, 4, 3), null);
  });

  test("vertical overflow can induce horizontal gutter via viewport reduction", () => {
    const leaf = buttonNode("btn");
    const root = scrollRow([leaf]);
    const tree = layoutNode(
      root,
      { x: 0, y: 0, w: 5, h: 4 },
      [layoutNode(leaf, { x: 0, y: 0, w: 5, h: 4 })],
      overflowMeta(0, 0, 5, 10, 5, 4),
    );

    assert.equal(hitTestFocusable(root, tree, 1, 3), null);
  });

  test("horizontal overflow can induce vertical gutter via viewport reduction", () => {
    const leaf = buttonNode("btn");
    const root = scrollRow([leaf]);
    const tree = layoutNode(
      root,
      { x: 0, y: 0, w: 5, h: 4 },
      [layoutNode(leaf, { x: 0, y: 0, w: 5, h: 4 })],
      overflowMeta(0, 0, 10, 4, 5, 4),
    );

    assert.equal(hitTestFocusable(root, tree, 4, 1), null);
  });

  test("box border and padding shift scroll viewport and clip gutters", () => {
    const leaf = buttonNode("btn");
    const root = scrollBox([leaf], { border: "single", p: 1 });
    const tree = layoutNode(
      root,
      { x: 0, y: 0, w: 8, h: 6 },
      [layoutNode(leaf, { x: 2, y: 2, w: 6, h: 4 })],
      overflowMeta(0, 0, 6, 4, 4, 2),
    );

    assert.equal(hitTestFocusable(root, tree, 2, 2), "btn");
    assert.equal(hitTestFocusable(root, tree, 5, 2), null);
    assert.equal(hitTestFocusable(root, tree, 2, 3), null);
  });

  test("nested scroll clips intersect deterministically", () => {
    const leaf = buttonNode("deep");
    const inner = scrollRow([leaf]);
    const outer = scrollRow([inner]);
    const tree = layoutNode(
      outer,
      { x: 0, y: 0, w: 6, h: 4 },
      [
        layoutNode(
          inner,
          { x: 0, y: 0, w: 5, h: 4 },
          [layoutNode(leaf, { x: 0, y: 0, w: 10, h: 4 })],
          overflowMeta(0, 0, 10, 4, 5, 4),
        ),
      ],
      overflowMeta(0, 0, 3, 8, 6, 4),
    );

    assert.equal(hitTestFocusable(outer, tree, 3, 2), "deep");
    assert.equal(hitTestFocusable(outer, tree, 4, 2), null);
  });

  test("non-finite metadata values clamp to zero deterministically", () => {
    const leaf = buttonNode("btn");
    const root = scrollRow([leaf]);
    const tree = layoutNode(
      root,
      { x: 0, y: 0, w: 5, h: 3 },
      [layoutNode(leaf, { x: 0, y: 0, w: 5, h: 1 })],
      {
        scrollX: Number.NaN,
        scrollY: -3,
        contentWidth: Number.NaN,
        contentHeight: Number.NEGATIVE_INFINITY,
        viewportWidth: Number.POSITIVE_INFINITY,
        viewportHeight: 0,
      },
    );

    assert.equal(hitTestFocusable(root, tree, 1, 0), "btn");
  });

  test("scroll container without metadata falls back to node clip", () => {
    const leaf = buttonNode("btn");
    const root = scrollRow([leaf]);
    const tree = layoutNode(root, { x: 0, y: 0, w: 3, h: 2 }, [
      layoutNode(leaf, { x: 2, y: 1, w: 2, h: 1 }),
    ]);

    assert.equal(hitTestFocusable(root, tree, 2, 1), "btn");
  });
});
