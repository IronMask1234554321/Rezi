/**
 * packages/core/src/widgets/__tests__/tree.golden.test.ts
 *
 * Tests for the tree widget algorithms: node flattening, expand/collapse,
 * tree line rendering, and keyboard navigation.
 *
 * @see docs/widgets/tree.md
 */

import { assert, describe, test } from "@rezi-ui/testkit";
import type { ZrevEvent } from "../../events.js";
import {
  ZR_KEY_DOWN,
  ZR_KEY_END,
  ZR_KEY_ENTER,
  ZR_KEY_HOME,
  ZR_KEY_LEFT,
  ZR_KEY_RIGHT,
  ZR_KEY_SPACE,
  ZR_KEY_UP,
} from "../../keybindings/keyCodes.js";
import type { TreeLocalState } from "../../runtime/localState.js";
import { type TreeRoutingCtx, routeTreeKey } from "../../runtime/router.js";
import {
  EXPAND_INDICATORS,
  type FlattenedNode,
  TREE_CHARS,
  collapseNode,
  computeNodeState,
  createLoadingState,
  expandAllSiblings,
  expandNode,
  findFirstChildIndex,
  findNextSiblingIndex,
  findNodeIndex,
  findParentIndex,
  findPrevSiblingIndex,
  flattenTree,
  getExpandIndicator,
  getTotalVisibleNodes,
  getTreeLinePrefix,
  toggleExpanded,
} from "../tree.js";

/* ========== Test Data Types ========== */

type TestNode = {
  id: string;
  name: string;
  children?: TestNode[];
};

/* ========== Helper Functions ========== */

function createKeyEvent(key: number, action: "down" | "up" = "down"): ZrevEvent {
  return { kind: "key", timeMs: 0, key, mods: 0, action };
}

function createTestTree(): TestNode {
  return {
    id: "root",
    name: "Root",
    children: [
      {
        id: "a",
        name: "A",
        children: [
          { id: "a1", name: "A1" },
          { id: "a2", name: "A2" },
        ],
      },
      {
        id: "b",
        name: "B",
        children: [{ id: "b1", name: "B1" }],
      },
      { id: "c", name: "C" },
    ],
  };
}

function createTreeCtx<T>(
  overrides: Partial<TreeRoutingCtx<T>> & Partial<TreeLocalState> = {},
): TreeRoutingCtx<T> {
  const testTree = createTestTree();
  const flatNodes = (overrides.flatNodes ??
    flattenTree(
      testTree,
      (n: TestNode) => n.id,
      (n: TestNode) => n.children,
      (n: TestNode) => (n.children?.length ?? 0) > 0,
      overrides.expanded ?? ["root"],
    )) as readonly FlattenedNode<T>[];

  const state: TreeLocalState = {
    focusedKey: overrides.focusedKey ?? null,
    loadingKeys: new Set(),
    scrollTop: overrides.scrollTop ?? 0,
    viewportHeight: overrides.viewportHeight ?? 20,
    flatCache: null,
    expandedSetRef: undefined,
    expandedSet: undefined,
    prefixCache: null,
  };

  return {
    treeId: overrides.treeId ?? "test-tree",
    flatNodes,
    expanded: overrides.expanded ?? ["root"],
    state,
    keyboardNavigation: overrides.keyboardNavigation ?? true,
  };
}

/* ========== Key Code Constants ========== */
/* ========== Flatten Tree Tests ========== */

describe("tree - flattenTree", () => {
  test("collapsed root shows only root", () => {
    const tree = createTestTree();
    const result = flattenTree(
      tree,
      (n) => n.id,
      (n) => n.children,
      (n) => (n.children?.length ?? 0) > 0,
      [], // nothing expanded
    );

    assert.equal(result.length, 1);
    assert.equal(result[0]?.key, "root");
  });

  test("expanded root shows root and immediate children", () => {
    const tree = createTestTree();
    const result = flattenTree(
      tree,
      (n) => n.id,
      (n) => n.children,
      (n) => (n.children?.length ?? 0) > 0,
      ["root"],
    );

    // root + a, b, c (children of root)
    assert.equal(result.length, 4);
    assert.equal(result[0]?.key, "root");
    assert.equal(result[1]?.key, "a");
    assert.equal(result[2]?.key, "b");
    assert.equal(result[3]?.key, "c");
  });

  test("nested expansion shows grandchildren", () => {
    const tree = createTestTree();
    const result = flattenTree(
      tree,
      (n) => n.id,
      (n) => n.children,
      (n) => (n.children?.length ?? 0) > 0,
      ["root", "a"],
    );

    // root, a, a1, a2, b, c
    assert.equal(result.length, 6);
    assert.equal(result[2]?.key, "a1");
    assert.equal(result[3]?.key, "a2");
  });

  test("flattened node has correct depth", () => {
    const tree = createTestTree();
    const result = flattenTree(
      tree,
      (n) => n.id,
      (n) => n.children,
      (n) => (n.children?.length ?? 0) > 0,
      ["root", "a"],
    );

    assert.equal(result[0]?.depth, 0); // root
    assert.equal(result[1]?.depth, 1); // a
    assert.equal(result[2]?.depth, 2); // a1
  });

  test("flattened node has correct sibling info", () => {
    const tree = createTestTree();
    const result = flattenTree(
      tree,
      (n) => n.id,
      (n) => n.children,
      (n) => (n.children?.length ?? 0) > 0,
      ["root"],
    );

    // a is first of 3 siblings
    const aNode = result[1];
    assert.equal(aNode?.siblingIndex, 0);
    assert.equal(aNode?.siblingCount, 3);

    // c is last of 3 siblings
    const cNode = result[3];
    assert.equal(cNode?.siblingIndex, 2);
    assert.equal(cNode?.siblingCount, 3);
  });

  test("array of roots", () => {
    const roots: TestNode[] = [
      { id: "r1", name: "Root 1" },
      { id: "r2", name: "Root 2" },
    ];

    const result = flattenTree(
      roots,
      (n) => n.id,
      (n) => n.children,
      (n) => (n.children?.length ?? 0) > 0,
      [],
    );

    assert.equal(result.length, 2);
    assert.equal(result[0]?.key, "r1");
    assert.equal(result[1]?.key, "r2");
  });
});

/* ========== NodeState Tests ========== */

describe("tree - computeNodeState", () => {
  test("computes correct expanded state", () => {
    const tree = createTestTree();
    const flat = flattenTree(
      tree,
      (n) => n.id,
      (n) => n.children,
      (n) => (n.children?.length ?? 0) > 0,
      ["root"],
    );

    const rootNode = flat[0];
    assert.ok(rootNode !== undefined);
    const rootState = computeNodeState(rootNode, ["root"], undefined, undefined, new Set());
    assert.equal(rootState.expanded, true);

    const aNode = flat[1];
    assert.ok(aNode !== undefined);
    const aState = computeNodeState(aNode, ["root"], undefined, undefined, new Set());
    assert.equal(aState.expanded, false);
  });

  test("computes correct selected state", () => {
    const tree = createTestTree();
    const flat = flattenTree(
      tree,
      (n) => n.id,
      (n) => n.children,
      (n) => (n.children?.length ?? 0) > 0,
      ["root"],
    );

    const aNode = flat[1];
    assert.ok(aNode !== undefined);
    const state = computeNodeState(aNode, ["root"], "a", undefined, new Set());
    assert.equal(state.selected, true);
  });

  test("computes correct loading state", () => {
    const tree = createTestTree();
    const flat = flattenTree(
      tree,
      (n) => n.id,
      (n) => n.children,
      (n) => (n.children?.length ?? 0) > 0,
      ["root"],
    );

    const loading = new Set(["a"]);
    const aNode = flat[1];
    assert.ok(aNode !== undefined);
    const state = computeNodeState(aNode, ["root"], undefined, undefined, loading);
    assert.equal(state.loading, true);
  });

  test("computes sibling position", () => {
    const tree = createTestTree();
    const flat = flattenTree(
      tree,
      (n) => n.id,
      (n) => n.children,
      (n) => (n.children?.length ?? 0) > 0,
      ["root"],
    );

    const aNode = flat[1];
    const cNode = flat[3];
    assert.ok(aNode !== undefined);
    assert.ok(cNode !== undefined);
    const aState = computeNodeState(aNode, ["root"], undefined, undefined, new Set());
    assert.equal(aState.isFirst, true);
    assert.equal(aState.isLast, false);

    const cState = computeNodeState(cNode, ["root"], undefined, undefined, new Set());
    assert.equal(cState.isFirst, false);
    assert.equal(cState.isLast, true);
  });
});

/* ========== Tree Line Prefix Tests ========== */

describe("tree - getTreeLinePrefix", () => {
  test("root has no prefix", () => {
    const tree = createTestTree();
    const flat = flattenTree(
      tree,
      (n) => n.id,
      (n) => n.children,
      (n) => (n.children?.length ?? 0) > 0,
      ["root"],
    );

    const rootNode = flat[0];
    assert.ok(rootNode !== undefined);
    const prefix = getTreeLinePrefix(rootNode, true, 3);
    assert.equal(prefix, "");
  });

  test("child with showLines=false has space indent", () => {
    const tree = createTestTree();
    const flat = flattenTree(
      tree,
      (n) => n.id,
      (n) => n.children,
      (n) => (n.children?.length ?? 0) > 0,
      ["root"],
    );

    const aNode = flat[1];
    assert.ok(aNode !== undefined);
    const prefix = getTreeLinePrefix(aNode, false, 3);
    assert.equal(prefix, "   ");
  });

  test("child with showLines=true has branch", () => {
    const tree = createTestTree();
    const flat = flattenTree(
      tree,
      (n) => n.id,
      (n) => n.children,
      (n) => (n.children?.length ?? 0) > 0,
      ["root"],
    );

    // a (first child, not last)
    const aNode = flat[1];
    const cNode = flat[3];
    assert.ok(aNode !== undefined);
    assert.ok(cNode !== undefined);
    const aPrefix = getTreeLinePrefix(aNode, true, 3);
    assert.ok(aPrefix.includes(TREE_CHARS.branch));

    // c (last child)
    const cPrefix = getTreeLinePrefix(cNode, true, 3);
    assert.ok(cPrefix.includes(TREE_CHARS.lastBranch));
  });
});

/* ========== Expand/Collapse Tests ========== */

describe("tree - expand/collapse", () => {
  test("expandNode adds key", () => {
    const result = expandNode(["a"], "b");
    assert.ok(result.includes("a"));
    assert.ok(result.includes("b"));
  });

  test("expandNode doesn't duplicate", () => {
    const result = expandNode(["a", "b"], "a");
    assert.equal(result.length, 2);
  });

  test("collapseNode removes key", () => {
    const result = collapseNode(["a", "b"], "a");
    assert.ok(!result.includes("a"));
    assert.ok(result.includes("b"));
  });

  test("toggleExpanded toggles state", () => {
    const result1 = toggleExpanded(["a"], "b");
    assert.ok(result1.expanded.includes("b"));
    assert.equal(result1.isExpanded, true);

    const result2 = toggleExpanded(["a", "b"], "b");
    assert.ok(!result2.expanded.includes("b"));
    assert.equal(result2.isExpanded, false);
  });
});

/* ========== Expand Indicator Tests ========== */

describe("tree - getExpandIndicator", () => {
  test("returns correct indicators", () => {
    assert.equal(getExpandIndicator(true, true, false), EXPAND_INDICATORS.expanded);
    assert.equal(getExpandIndicator(true, false, false), EXPAND_INDICATORS.collapsed);
    assert.equal(getExpandIndicator(false, false, false), EXPAND_INDICATORS.leaf);
    assert.equal(getExpandIndicator(true, false, true), EXPAND_INDICATORS.loading);
  });
});

/* ========== Loading State Tests ========== */

describe("tree - createLoadingState", () => {
  test("tracks loading state", () => {
    let state = createLoadingState();
    assert.equal(state.isLoading("a"), false);

    state = state.startLoading("a");
    assert.equal(state.isLoading("a"), true);

    state = state.finishLoading("a");
    assert.equal(state.isLoading("a"), false);
  });

  test("initial state from array", () => {
    const state = createLoadingState(["a", "b"]);
    assert.equal(state.isLoading("a"), true);
    assert.equal(state.isLoading("b"), true);
    assert.equal(state.isLoading("c"), false);
  });
});

/* ========== Navigation Helpers ========== */

describe("tree - navigation helpers", () => {
  test("findNodeIndex finds correct index", () => {
    const tree = createTestTree();
    const flat = flattenTree(
      tree,
      (n) => n.id,
      (n) => n.children,
      (n) => (n.children?.length ?? 0) > 0,
      ["root"],
    );

    assert.equal(findNodeIndex(flat, "a"), 1);
    assert.equal(findNodeIndex(flat, "c"), 3);
    assert.equal(findNodeIndex(flat, "notfound"), -1);
  });

  test("findParentIndex finds parent", () => {
    const tree = createTestTree();
    const flat = flattenTree(
      tree,
      (n) => n.id,
      (n) => n.children,
      (n) => (n.children?.length ?? 0) > 0,
      ["root", "a"],
    );

    // a1's parent is a
    const a1Index = findNodeIndex(flat, "a1");
    const parentIndex = findParentIndex(flat, a1Index);
    assert.equal(flat[parentIndex]?.key, "a");
  });

  test("findFirstChildIndex finds child", () => {
    const tree = createTestTree();
    const flat = flattenTree(
      tree,
      (n) => n.id,
      (n) => n.children,
      (n) => (n.children?.length ?? 0) > 0,
      ["root", "a"],
    );

    const aIndex = findNodeIndex(flat, "a");
    const childIndex = findFirstChildIndex(flat, aIndex);
    assert.equal(flat[childIndex]?.key, "a1");
  });

  test("findNextSiblingIndex finds sibling", () => {
    const tree = createTestTree();
    const flat = flattenTree(
      tree,
      (n) => n.id,
      (n) => n.children,
      (n) => (n.children?.length ?? 0) > 0,
      ["root"],
    );

    const aIndex = findNodeIndex(flat, "a");
    const nextIndex = findNextSiblingIndex(flat, aIndex);
    assert.equal(flat[nextIndex]?.key, "b");
  });

  test("findPrevSiblingIndex finds sibling", () => {
    const tree = createTestTree();
    const flat = flattenTree(
      tree,
      (n) => n.id,
      (n) => n.children,
      (n) => (n.children?.length ?? 0) > 0,
      ["root"],
    );

    const bIndex = findNodeIndex(flat, "b");
    const prevIndex = findPrevSiblingIndex(flat, bIndex);
    assert.equal(flat[prevIndex]?.key, "a");
  });

  test("getTotalVisibleNodes returns count", () => {
    const tree = createTestTree();
    const flat = flattenTree(
      tree,
      (n) => n.id,
      (n) => n.children,
      (n) => (n.children?.length ?? 0) > 0,
      ["root"],
    );

    assert.equal(getTotalVisibleNodes(flat), 4);
  });
});

/* ========== Keyboard Navigation Tests ========== */

describe("tree - keyboard navigation", () => {
  test("arrow down moves to next visible node", () => {
    const ctx = createTreeCtx({ focusedKey: "root" });
    const result = routeTreeKey(createKeyEvent(ZR_KEY_DOWN), ctx);

    assert.equal(result.nextFocusedKey, "a");
    assert.equal(result.consumed, true);
  });

  test("arrow up moves to previous visible node", () => {
    const ctx = createTreeCtx({ focusedKey: "b" });
    const result = routeTreeKey(createKeyEvent(ZR_KEY_UP), ctx);

    assert.equal(result.nextFocusedKey, "a");
    assert.equal(result.consumed, true);
  });

  test("arrow right on collapsed expands", () => {
    const ctx = createTreeCtx({ focusedKey: "a", expanded: ["root"] });
    const result = routeTreeKey(createKeyEvent(ZR_KEY_RIGHT), ctx);

    assert.ok(result.nextExpanded?.includes("a"));
    assert.equal(result.consumed, true);
  });

  test("arrow right on expanded moves to first child", () => {
    // Need to create a context with a expanded
    const tree = createTestTree();
    const flat = flattenTree(
      tree,
      (n) => n.id,
      (n) => n.children,
      (n) => (n.children?.length ?? 0) > 0,
      ["root", "a"],
    );

    const state: TreeLocalState = {
      focusedKey: "a",
      loadingKeys: new Set(),
      scrollTop: 0,
      viewportHeight: 20,
      flatCache: null,
      expandedSetRef: undefined,
      expandedSet: undefined,
      prefixCache: null,
    };

    const ctx: TreeRoutingCtx<TestNode> = {
      treeId: "test-tree",
      flatNodes: flat,
      expanded: ["root", "a"],
      state,
      keyboardNavigation: true,
    };

    const result = routeTreeKey(createKeyEvent(ZR_KEY_RIGHT), ctx);

    assert.equal(result.nextFocusedKey, "a1");
    assert.equal(result.consumed, true);
  });

  test("arrow left on expanded collapses", () => {
    const tree = createTestTree();
    const flat = flattenTree(
      tree,
      (n) => n.id,
      (n) => n.children,
      (n) => (n.children?.length ?? 0) > 0,
      ["root", "a"],
    );

    const state: TreeLocalState = {
      focusedKey: "a",
      loadingKeys: new Set(),
      scrollTop: 0,
      viewportHeight: 20,
      flatCache: null,
      expandedSetRef: undefined,
      expandedSet: undefined,
      prefixCache: null,
    };

    const ctx: TreeRoutingCtx<TestNode> = {
      treeId: "test-tree",
      flatNodes: flat,
      expanded: ["root", "a"],
      state,
      keyboardNavigation: true,
    };

    const result = routeTreeKey(createKeyEvent(ZR_KEY_LEFT), ctx);

    assert.ok(!result.nextExpanded?.includes("a"));
    assert.equal(result.consumed, true);
  });

  test("arrow left on collapsed moves to parent", () => {
    const tree = createTestTree();
    const flat = flattenTree(
      tree,
      (n) => n.id,
      (n) => n.children,
      (n) => (n.children?.length ?? 0) > 0,
      ["root", "a"],
    );

    const state: TreeLocalState = {
      focusedKey: "a1",
      loadingKeys: new Set(),
      scrollTop: 0,
      viewportHeight: 20,
      flatCache: null,
      expandedSetRef: undefined,
      expandedSet: undefined,
      prefixCache: null,
    };

    const ctx: TreeRoutingCtx<TestNode> = {
      treeId: "test-tree",
      flatNodes: flat,
      expanded: ["root", "a"],
      state,
      keyboardNavigation: true,
    };

    const result = routeTreeKey(createKeyEvent(ZR_KEY_LEFT), ctx);

    assert.equal(result.nextFocusedKey, "a");
    assert.equal(result.consumed, true);
  });

  test("home jumps to first node", () => {
    const ctx = createTreeCtx({ focusedKey: "c" });
    const result = routeTreeKey(createKeyEvent(ZR_KEY_HOME), ctx);

    assert.equal(result.nextFocusedKey, "root");
    assert.equal(result.nextScrollTop, 0);
    assert.equal(result.consumed, true);
  });

  test("end jumps to last node", () => {
    const ctx = createTreeCtx({ focusedKey: "root" });
    const result = routeTreeKey(createKeyEvent(ZR_KEY_END), ctx);

    assert.equal(result.nextFocusedKey, "c");
    assert.equal(result.consumed, true);
  });

  test("enter activates node", () => {
    const ctx = createTreeCtx({ focusedKey: "a" });
    const result = routeTreeKey(createKeyEvent(ZR_KEY_ENTER), ctx);

    assert.equal(result.nodeToActivate, "a");
    assert.equal(result.consumed, true);
  });

  test("space toggles expand/collapse", () => {
    const ctx = createTreeCtx({ focusedKey: "a", expanded: ["root"] });
    const result = routeTreeKey(createKeyEvent(ZR_KEY_SPACE), ctx);

    assert.ok(result.nextExpanded?.includes("a"));
    assert.equal(result.consumed, true);
  });

  test("keyboard navigation disabled returns consumed: false", () => {
    const ctx = createTreeCtx({ keyboardNavigation: false });
    const result = routeTreeKey(createKeyEvent(ZR_KEY_DOWN), ctx);

    assert.equal(result.consumed, false);
  });
});

/* ========== Lazy Loading Tests ========== */

describe("tree - lazy loading behavior", () => {
  test("arrow right on collapsed node with no visible children triggers load", () => {
    // Create a tree with a node that hasChildren but no children array
    const lazyNode: TestNode = {
      id: "lazy",
      name: "Lazy",
      // No children array, but hasChildren returns true
    };

    const flat = flattenTree(
      [lazyNode],
      (n) => n.id,
      (n) => n.children,
      () => true, // hasChildren always true
      [],
    );

    const state: TreeLocalState = {
      focusedKey: "lazy",
      loadingKeys: new Set(),
      scrollTop: 0,
      viewportHeight: 20,
      flatCache: null,
      expandedSetRef: undefined,
      expandedSet: undefined,
      prefixCache: null,
    };

    const ctx: TreeRoutingCtx<TestNode> = {
      treeId: "test-tree",
      flatNodes: flat,
      expanded: [],
      state,
      keyboardNavigation: true,
    };

    const result = routeTreeKey(createKeyEvent(ZR_KEY_RIGHT), ctx);

    // Should mark node for loading
    assert.equal(result.nodeToLoad, "lazy");
    assert.ok(result.nextExpanded?.includes("lazy"));
    assert.equal(result.consumed, true);
  });
});

/* ========== Expand All Siblings Tests ========== */

describe("tree - expandAllSiblings", () => {
  test("expands all siblings with children", () => {
    const tree = createTestTree();
    const flat = flattenTree(
      tree,
      (n) => n.id,
      (n) => n.children,
      (n) => (n.children?.length ?? 0) > 0,
      ["root"],
    );

    // Expand all siblings of "a" (which includes a, b - c has no children)
    const aIndex = findNodeIndex(flat, "a");
    const newExpanded = expandAllSiblings(flat, aIndex, ["root"]);

    assert.ok(newExpanded.includes("root"));
    assert.ok(newExpanded.includes("a"));
    assert.ok(newExpanded.includes("b"));
    // c has no children so it shouldn't be in expanded
  });

  test("returns unchanged if no siblings to expand", () => {
    const singleNode: TestNode = { id: "single", name: "Single" };
    const flat = flattenTree(
      singleNode,
      (n) => n.id,
      (n) => n.children,
      (n) => (n.children?.length ?? 0) > 0,
      [],
    );

    const result = expandAllSiblings(flat, 0, []);

    // No siblings with children, so nothing to expand
    assert.equal(result.length, 0);
  });
});

/* ========== Asterisk Key Tests ========== */

describe("tree - asterisk key expands all siblings", () => {
  const ZR_KEY_ASTERISK = 42;

  test("asterisk expands all siblings", () => {
    const tree = createTestTree();
    const flat = flattenTree(
      tree,
      (n) => n.id,
      (n) => n.children,
      (n) => (n.children?.length ?? 0) > 0,
      ["root"],
    );

    const state: TreeLocalState = {
      focusedKey: "a",
      loadingKeys: new Set(),
      scrollTop: 0,
      viewportHeight: 20,
      flatCache: null,
      expandedSetRef: undefined,
      expandedSet: undefined,
      prefixCache: null,
    };

    const ctx: TreeRoutingCtx<TestNode> = {
      treeId: "test-tree",
      flatNodes: flat,
      expanded: ["root"],
      state,
      keyboardNavigation: true,
    };

    const result = routeTreeKey(createKeyEvent(ZR_KEY_ASTERISK), ctx);

    assert.ok(result.nextExpanded?.includes("a"));
    assert.ok(result.nextExpanded?.includes("b"));
    assert.equal(result.consumed, true);
  });
});
