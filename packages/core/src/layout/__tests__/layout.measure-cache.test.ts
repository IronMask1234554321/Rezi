import { assert, describe, test } from "@rezi-ui/testkit";
import type { VNode } from "../../index.js";
import { layout } from "../layout.js";

function layoutResult(
  node: VNode,
  maxW: number,
  maxH: number,
  axis: "row" | "column" = "column",
  measureCache?: WeakMap<VNode, unknown>,
): ReturnType<typeof layout> {
  return layout(node, 0, 0, maxW, maxH, axis, measureCache);
}

function mustLayout(
  node: VNode,
  maxW: number,
  maxH: number,
  axis: "row" | "column" = "column",
  measureCache?: WeakMap<VNode, unknown>,
): void {
  const result = layoutResult(node, maxW, maxH, axis, measureCache);
  if (!result.ok) {
    assert.fail(`layout failed: ${result.fatal.code}: ${result.fatal.detail}`);
  }
}

function expectLayoutFatal(result: ReturnType<typeof layout>, detail: string): void {
  assert.equal(result.ok, false);
  if (result.ok) {
    assert.fail("expected layout failure");
  }
  assert.equal(result.fatal.code, "ZRUI_INVALID_PROPS");
  assert.equal(result.fatal.detail, detail);
}

function createCountingTextVNode(
  value: string,
  props: Record<string, unknown> = {},
): Readonly<{
  vnode: VNode;
  reads: () => number;
}> {
  let readCount = 0;
  const node = { kind: "text", props } as {
    kind: "text";
    props: Record<string, unknown>;
    text?: string;
  };
  Object.defineProperty(node, "text", {
    configurable: true,
    enumerable: true,
    get: () => {
      readCount++;
      return value;
    },
  });
  return Object.freeze({
    vnode: node as unknown as VNode,
    reads: () => readCount,
  });
}

function rowWithChildren(children: readonly VNode[]): VNode {
  return {
    kind: "row",
    props: {},
    children: Object.freeze([...children]),
  } as unknown as VNode;
}

function columnWithChildren(children: readonly VNode[]): VNode {
  return {
    kind: "column",
    props: {},
    children: Object.freeze([...children]),
  } as unknown as VNode;
}

function spacer(props: Record<string, unknown> = {}): VNode {
  return {
    kind: "spacer",
    props,
  } as unknown as VNode;
}

describe("layout measure cache", () => {
  test("same vnode + same constraints hits (column axis)", () => {
    const cache = new WeakMap<VNode, unknown>();
    const tracked = createCountingTextVNode("cache-hit");

    mustLayout(tracked.vnode, 40, 5, "column", cache);
    assert.equal(tracked.reads(), 1);

    mustLayout(tracked.vnode, 40, 5, "column", cache);
    assert.equal(tracked.reads(), 1);
  });

  test("same vnode + same constraints hits (row axis)", () => {
    const cache = new WeakMap<VNode, unknown>();
    const tracked = createCountingTextVNode("cache-hit-row");

    mustLayout(tracked.vnode, 40, 5, "row", cache);
    assert.equal(tracked.reads(), 1);

    mustLayout(tracked.vnode, 40, 5, "row", cache);
    assert.equal(tracked.reads(), 1);
  });

  test("maxW is independent in cache key", () => {
    const cache = new WeakMap<VNode, unknown>();
    const tracked = createCountingTextVNode("maxw-independence");

    mustLayout(tracked.vnode, 40, 5, "column", cache);
    assert.equal(tracked.reads(), 1);

    mustLayout(tracked.vnode, 39, 5, "column", cache);
    assert.equal(tracked.reads(), 2);

    mustLayout(tracked.vnode, 40, 5, "column", cache);
    assert.equal(tracked.reads(), 2);

    mustLayout(tracked.vnode, 39, 5, "column", cache);
    assert.equal(tracked.reads(), 2);
  });

  test("maxH is independent in cache key", () => {
    const cache = new WeakMap<VNode, unknown>();
    const tracked = createCountingTextVNode("maxh-independence");

    mustLayout(tracked.vnode, 40, 5, "column", cache);
    assert.equal(tracked.reads(), 1);

    mustLayout(tracked.vnode, 40, 4, "column", cache);
    assert.equal(tracked.reads(), 2);

    mustLayout(tracked.vnode, 40, 5, "column", cache);
    assert.equal(tracked.reads(), 2);

    mustLayout(tracked.vnode, 40, 4, "column", cache);
    assert.equal(tracked.reads(), 2);
  });

  test("axis is independent in cache key", () => {
    const cache = new WeakMap<VNode, unknown>();
    const tracked = createCountingTextVNode("axis-independence");

    mustLayout(tracked.vnode, 40, 5, "column", cache);
    assert.equal(tracked.reads(), 1);

    mustLayout(tracked.vnode, 40, 5, "row", cache);
    assert.equal(tracked.reads(), 2);

    mustLayout(tracked.vnode, 40, 5, "column", cache);
    assert.equal(tracked.reads(), 2);

    mustLayout(tracked.vnode, 40, 5, "row", cache);
    assert.equal(tracked.reads(), 2);
  });

  test("multi-constraint usage in same pass stores all encountered keys", () => {
    const cache = new WeakMap<VNode, unknown>();
    const tracked = createCountingTextVNode("same-pass-multi-constraints");
    const root = columnWithChildren([tracked.vnode, spacer({ flex: 1 })]);

    mustLayout(root, 30, 6, "column", cache);
    const readsAfterFirst = tracked.reads();
    assert.ok(
      readsAfterFirst >= 2,
      "constraint-pass tree should measure the same leaf under multiple constraints in one pass",
    );

    mustLayout(root, 30, 6, "column", cache);
    assert.equal(tracked.reads(), readsAfterFirst);
  });

  test("cross-pass reuse with shared WeakMap survives rebuilt parent identity", () => {
    const cache = new WeakMap<VNode, unknown>();
    const tracked = createCountingTextVNode("shared-cross-pass");
    const rootA = rowWithChildren([tracked.vnode]);
    const rootB = rowWithChildren([tracked.vnode]);

    mustLayout(rootA, 40, 5, "column", cache);
    const readsAfterA = tracked.reads();
    assert.ok(readsAfterA > 0);

    mustLayout(rootB, 40, 5, "column", cache);
    assert.equal(tracked.reads(), readsAfterA);
  });

  test("separate WeakMap instances do not share hits", () => {
    const cacheA = new WeakMap<VNode, unknown>();
    const cacheB = new WeakMap<VNode, unknown>();
    const tracked = createCountingTextVNode("separate-caches");

    mustLayout(tracked.vnode, 40, 5, "column", cacheA);
    const readsAfterA = tracked.reads();

    mustLayout(tracked.vnode, 40, 5, "column", cacheB);
    assert.ok(tracked.reads() > readsAfterA);
  });

  test("shared cache still hits after using a different cache", () => {
    const cacheA = new WeakMap<VNode, unknown>();
    const cacheB = new WeakMap<VNode, unknown>();
    const tracked = createCountingTextVNode("return-to-cache-a");

    mustLayout(tracked.vnode, 40, 5, "column", cacheA);
    const readsAfterA = tracked.reads();

    mustLayout(tracked.vnode, 40, 5, "column", cacheB);
    const readsAfterB = tracked.reads();
    assert.ok(readsAfterB > readsAfterA);

    mustLayout(tracked.vnode, 40, 5, "column", cacheA);
    assert.equal(tracked.reads(), readsAfterB);
  });

  test("without shared cache, repeated layout remeasures", () => {
    const tracked = createCountingTextVNode("no-shared-cache");

    mustLayout(tracked.vnode, 40, 5);
    assert.equal(tracked.reads(), 1);

    mustLayout(tracked.vnode, 40, 5);
    assert.equal(tracked.reads(), 2);

    mustLayout(tracked.vnode, 40, 5);
    assert.equal(tracked.reads(), 3);
  });

  test("deeply cloned vnode tree misses despite identical structure", () => {
    const cache = new WeakMap<VNode, unknown>();
    const trackedA = createCountingTextVNode("deep-clone");
    const treeA = columnWithChildren([rowWithChildren([columnWithChildren([trackedA.vnode])])]);

    mustLayout(treeA, 50, 8, "column", cache);
    const readsAfterTreeA = trackedA.reads();
    assert.ok(readsAfterTreeA > 0);

    const trackedB = createCountingTextVNode("deep-clone");
    const treeB = columnWithChildren([rowWithChildren([columnWithChildren([trackedB.vnode])])]);

    mustLayout(treeB, 50, 8, "column", cache);
    assert.equal(trackedA.reads(), readsAfterTreeA);
    assert.ok(trackedB.reads() > 0);
  });

  test("structurally equal but distinct vnode identity misses", () => {
    const cache = new WeakMap<VNode, unknown>();
    const a = createCountingTextVNode("same-shape");
    const b = createCountingTextVNode("same-shape");

    mustLayout(a.vnode, 40, 5, "column", cache);
    assert.ok(a.reads() > 0);
    assert.equal(b.reads(), 0);

    mustLayout(b.vnode, 40, 5, "column", cache);
    assert.ok(b.reads() > 0);
  });

  test("different text content is not falsely shared", () => {
    const cache = new WeakMap<VNode, unknown>();
    const a = createCountingTextVNode("short");
    const b = createCountingTextVNode("a very different width");

    mustLayout(a.vnode, 40, 5, "column", cache);
    assert.equal(a.reads(), 1);
    assert.equal(b.reads(), 0);

    mustLayout(b.vnode, 40, 5, "column", cache);
    assert.equal(a.reads(), 1);
    assert.equal(b.reads(), 1);

    mustLayout(b.vnode, 40, 5, "column", cache);
    assert.equal(b.reads(), 1);
  });

  test("shared cache keeps independent entries per vnode identity", () => {
    const cache = new WeakMap<VNode, unknown>();
    const a = createCountingTextVNode("A");
    const b = createCountingTextVNode("B");

    mustLayout(a.vnode, 30, 4, "column", cache);
    mustLayout(b.vnode, 30, 4, "column", cache);

    assert.ok(cache.get(a.vnode) !== undefined);
    assert.ok(cache.get(b.vnode) !== undefined);
  });

  test("0 constraints are handled and cached deterministically", () => {
    const cache = new WeakMap<VNode, unknown>();
    const tracked = createCountingTextVNode("zero-constraints");

    mustLayout(tracked.vnode, 0, 0, "column", cache);
    assert.equal(tracked.reads(), 1);

    mustLayout(tracked.vnode, 0, 0, "column", cache);
    assert.equal(tracked.reads(), 1);
  });

  test("0 constraints for nested row validate children once per vnode key", () => {
    const cache = new WeakMap<VNode, unknown>();
    const a = createCountingTextVNode("zero-nested-a");
    const b = createCountingTextVNode("zero-nested-b");
    const root = rowWithChildren([a.vnode, b.vnode]);

    mustLayout(root, 0, 0, "column", cache);
    assert.equal(a.reads(), 1);
    assert.equal(b.reads(), 1);

    mustLayout(root, 0, 0, "column", cache);
    assert.equal(a.reads(), 1);
    assert.equal(b.reads(), 1);
  });

  test("Infinity maxW fails deterministically before measurement", () => {
    const cache = new WeakMap<VNode, unknown>();
    const tracked = createCountingTextVNode("invalid-maxw-inf");

    const result = layoutResult(tracked.vnode, Number.POSITIVE_INFINITY, 5, "column", cache);
    expectLayoutFatal(result, "layout: maxW must be an int32 >= 0");
    assert.equal(tracked.reads(), 0);
    assert.equal(cache.get(tracked.vnode), undefined);
  });

  test("Infinity maxH fails deterministically before measurement", () => {
    const cache = new WeakMap<VNode, unknown>();
    const tracked = createCountingTextVNode("invalid-maxh-inf");

    const result = layoutResult(tracked.vnode, 40, Number.POSITIVE_INFINITY, "column", cache);
    expectLayoutFatal(result, "layout: maxH must be an int32 >= 0");
    assert.equal(tracked.reads(), 0);
    assert.equal(cache.get(tracked.vnode), undefined);
  });

  test("negative maxW fails deterministically before measurement", () => {
    const cache = new WeakMap<VNode, unknown>();
    const tracked = createCountingTextVNode("invalid-maxw-negative");

    const result = layoutResult(tracked.vnode, -1, 5, "column", cache);
    expectLayoutFatal(result, "layout: maxW must be an int32 >= 0");
    assert.equal(tracked.reads(), 0);
    assert.equal(cache.get(tracked.vnode), undefined);
  });

  test("negative maxH fails deterministically before measurement", () => {
    const cache = new WeakMap<VNode, unknown>();
    const tracked = createCountingTextVNode("invalid-maxh-negative");

    const result = layoutResult(tracked.vnode, 40, -1, "column", cache);
    expectLayoutFatal(result, "layout: maxH must be an int32 >= 0");
    assert.equal(tracked.reads(), 0);
    assert.equal(cache.get(tracked.vnode), undefined);
  });

  test("no cache corruption from mixed constraints", () => {
    const cache = new WeakMap<VNode, unknown>();
    const tracked = createCountingTextVNode("mixed-constraints");

    mustLayout(tracked.vnode, 40, 5, "column", cache);
    assert.equal(tracked.reads(), 1);

    mustLayout(tracked.vnode, 39, 5, "column", cache);
    assert.equal(tracked.reads(), 2);

    mustLayout(tracked.vnode, 40, 4, "column", cache);
    assert.equal(tracked.reads(), 3);

    mustLayout(tracked.vnode, 40, 5, "row", cache);
    assert.equal(tracked.reads(), 4);

    mustLayout(tracked.vnode, 40, 5, "column", cache);
    mustLayout(tracked.vnode, 39, 5, "column", cache);
    mustLayout(tracked.vnode, 40, 4, "column", cache);
    mustLayout(tracked.vnode, 40, 5, "row", cache);
    assert.equal(tracked.reads(), 4);
  });

  test("nested child measurements hit cache across repeated root layouts", () => {
    const cache = new WeakMap<VNode, unknown>();
    const child = createCountingTextVNode("child");
    const root = rowWithChildren([child.vnode]);

    mustLayout(root, 40, 5, "column", cache);
    const readsAfterFirst = child.reads();
    assert.ok(readsAfterFirst > 0);

    mustLayout(root, 40, 5, "column", cache);
    assert.equal(child.reads(), readsAfterFirst);
  });

  test("nested child remeasures when parent constraints change", () => {
    const cache = new WeakMap<VNode, unknown>();
    const child = createCountingTextVNode("child");
    const root = rowWithChildren([child.vnode]);

    mustLayout(root, 40, 5, "column", cache);
    const readsAfterFirst = child.reads();

    mustLayout(root, 39, 5, "column", cache);
    assert.ok(child.reads() > readsAfterFirst);
  });

  test("without shared cache, nested child remeasures across root layouts", () => {
    const child = createCountingTextVNode("child-no-shared-cache");
    const root = rowWithChildren([child.vnode]);

    mustLayout(root, 40, 5, "column");
    const readsAfterFirst = child.reads();
    assert.ok(readsAfterFirst > 0);

    mustLayout(root, 40, 5, "column");
    assert.ok(child.reads() > readsAfterFirst);
  });

  test("cache interaction with nested trees and selective path changes", () => {
    const cache = new WeakMap<VNode, unknown>();
    const stableLeaf = createCountingTextVNode("stable-branch");
    const changedLeafV1 = createCountingTextVNode("changed-branch-v1");
    const rootV1 = columnWithChildren([
      rowWithChildren([stableLeaf.vnode]),
      rowWithChildren([changedLeafV1.vnode]),
    ]);

    mustLayout(rootV1, 50, 8, "column", cache);
    const stableReadsAfterV1 = stableLeaf.reads();
    const changedV1ReadsAfterV1 = changedLeafV1.reads();
    assert.ok(stableReadsAfterV1 > 0);
    assert.ok(changedV1ReadsAfterV1 > 0);

    const changedLeafV2 = createCountingTextVNode("changed-branch-v2");
    const rootV2 = columnWithChildren([
      rowWithChildren([stableLeaf.vnode]),
      rowWithChildren([changedLeafV2.vnode]),
    ]);

    mustLayout(rootV2, 50, 8, "column", cache);
    assert.equal(stableLeaf.reads(), stableReadsAfterV1);
    assert.equal(changedLeafV1.reads(), changedV1ReadsAfterV1);
    assert.ok(changedLeafV2.reads() > 0);

    const changedV2ReadsAfterFirst = changedLeafV2.reads();
    mustLayout(rootV2, 50, 8, "column", cache);
    assert.equal(stableLeaf.reads(), stableReadsAfterV1);
    assert.equal(changedLeafV2.reads(), changedV2ReadsAfterFirst);
  });
});
