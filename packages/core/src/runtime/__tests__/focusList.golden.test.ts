import { assert, describe, readFixture, test } from "@rezi-ui/testkit";
import type { VNode } from "../../index.js";
import { commitVNodeTree } from "../commit.js";
import {
  computeFocusList,
  createFocusState,
  finalizeFocusForCommittedTree,
  requestPendingFocusChange,
} from "../focus.js";
import { createInstanceIdAllocator } from "../instance.js";

type FixtureVNode =
  | Readonly<{ kind: "text"; text: string; props?: unknown }>
  | Readonly<{ kind: "spacer"; props?: unknown }>
  | Readonly<{ kind: "button"; props: unknown }>
  | Readonly<{
      kind: "row" | "column" | "box";
      props?: unknown;
      children?: readonly FixtureVNode[];
    }>;

type FocusListCase = Readonly<{
  name: string;
  tree: FixtureVNode;
  expectedFocusList: readonly string[];
}>;

type FocusReconcileCase = Readonly<{
  name: string;
  initialFocusedId: string | null;
  nextTree: FixtureVNode;
  expectedFocusedIdAfterCommit: string | null;
}>;

type FocusListFixture = Readonly<{
  schemaVersion: 1;
  cases: readonly FocusListCase[];
  reconcileCases: readonly FocusReconcileCase[];
}>;

function toVNode(node: FixtureVNode): VNode {
  const props = (node as { props?: unknown }).props ?? {};
  switch (node.kind) {
    case "text":
      return { kind: "text", text: node.text, props: props as never };
    case "spacer":
      return { kind: "spacer", props: props as never };
    case "button":
      return { kind: "button", props: node.props as never };
    case "row":
    case "column":
    case "box":
      return {
        kind: node.kind,
        props: props as never,
        children: Object.freeze((node.children ?? []).map(toVNode)),
      };
  }
}

async function loadFixture(): Promise<FocusListFixture> {
  const bytes = await readFixture("focus/focus_list.json");
  const json = new TextDecoder().decode(bytes);
  return JSON.parse(json) as FocusListFixture;
}

function commitTree(vnode: VNode) {
  const allocator = createInstanceIdAllocator(1);
  const res = commitVNodeTree(null, vnode, { allocator });
  if (!res.ok) {
    assert.fail(`commit failed: ${res.fatal.code}: ${res.fatal.detail}`);
  }
  return res.value.root;
}

describe("focus (locked) - golden fixtures", () => {
  test("focus_list.json: computeFocusList", async () => {
    const f = await loadFixture();
    assert.equal(f.schemaVersion, 1);

    for (const c of f.cases) {
      const committed = commitTree(toVNode(c.tree));
      const list = computeFocusList(committed);
      assert.deepEqual(list, c.expectedFocusList, c.name);
    }
  });

  test("focus_list.json: focused id disappearance after commit", async () => {
    const f = await loadFixture();
    assert.equal(f.schemaVersion, 1);

    for (const c of f.reconcileCases) {
      const committedNext = commitTree(toVNode(c.nextTree));
      const st0 =
        c.initialFocusedId === null
          ? createFocusState()
          : Object.freeze({ focusedId: c.initialFocusedId });
      const st1 = finalizeFocusForCommittedTree(st0, committedNext);
      assert.equal(st1.focusedId, c.expectedFocusedIdAfterCommit, c.name);
    }
  });

  test("rapid pending focus transitions resolve deterministically", () => {
    const treeA: VNode = {
      kind: "column",
      props: {},
      children: Object.freeze([
        { kind: "button", props: { id: "a", label: "A" } },
        { kind: "button", props: { id: "b", label: "B" } },
      ]),
    };
    const treeB: VNode = {
      kind: "column",
      props: {},
      children: Object.freeze([
        { kind: "button", props: { id: "c", label: "C" } },
        { kind: "button", props: { id: "d", label: "D" } },
      ]),
    };

    const runSequence = () => {
      const outputs: Array<string | null> = [];
      let state = Object.freeze({ focusedId: "a" as string | null });

      state = finalizeFocusForCommittedTree(state, commitTree(treeA));
      outputs.push(state.focusedId);

      state = requestPendingFocusChange(state, "b");
      state = finalizeFocusForCommittedTree(state, commitTree(treeA));
      outputs.push(state.focusedId);

      state = requestPendingFocusChange(state, "missing");
      state = finalizeFocusForCommittedTree(state, commitTree(treeB));
      outputs.push(state.focusedId);

      state = requestPendingFocusChange(state, "d");
      state = finalizeFocusForCommittedTree(state, commitTree(treeB));
      outputs.push(state.focusedId);

      return outputs;
    };

    const seq1 = runSequence();
    const seq2 = runSequence();

    assert.deepEqual(seq1, Object.freeze(["a", "b", "c", "d"]));
    assert.deepEqual(seq2, seq1, "same rapid sequence should resolve identically");
  });
});
