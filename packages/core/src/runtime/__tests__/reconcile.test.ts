import { assert, test } from "@rezi-ui/testkit";
import type { VNode } from "../../index.js";
import { createInstanceIdAllocator } from "../instance.js";
import { reconcileChildren } from "../reconcile.js";

function textVNode(text: string, key?: string): VNode {
  return {
    kind: "text",
    text,
    props: key === undefined ? {} : { key },
  };
}

test("key-based reordering preserves instance identity (#64)", () => {
  const allocator = createInstanceIdAllocator(1);

  const prevChildren = [
    { instanceId: allocator.allocate(), vnode: textVNode("a0", "a") },
    { instanceId: allocator.allocate(), vnode: textVNode("b0", "b") },
    { instanceId: allocator.allocate(), vnode: textVNode("c0", "c") },
  ] as const;

  const nextVChildren = [textVNode("c1", "c"), textVNode("a1", "a"), textVNode("b1", "b")] as const;

  const res = reconcileChildren(99, prevChildren, nextVChildren, allocator);
  assert.equal(res.ok, true);
  if (!res.ok) return;

  assert.deepEqual(
    res.value.nextChildren.map((c) => c.instanceId),
    [3, 1, 2],
  );
  assert.deepEqual(res.value.reusedInstanceIds, [3, 1, 2]);
  assert.deepEqual(res.value.newInstanceIds, []);
  assert.deepEqual(res.value.unmountedInstanceIds, []);
  assert.deepEqual(
    res.value.nextChildren.map((c) => c.prevIndex),
    [2, 0, 1],
  );
});

test("index-based identity without keys follows i:${index} (#64)", () => {
  const allocator = createInstanceIdAllocator(1);

  const prevChildren = [
    { instanceId: allocator.allocate(), vnode: textVNode("A0") },
    { instanceId: allocator.allocate(), vnode: textVNode("B0") },
  ] as const;

  const nextVChildren = [textVNode("X1"), textVNode("A1"), textVNode("B1")] as const;

  const res = reconcileChildren(5, prevChildren, nextVChildren, allocator);
  assert.equal(res.ok, true);
  if (!res.ok) return;

  assert.deepEqual(
    res.value.nextChildren.map((c) => c.instanceId),
    [1, 2, 3],
  );
  assert.deepEqual(res.value.reusedInstanceIds, [1, 2]);
  assert.deepEqual(res.value.newInstanceIds, [3]);
  assert.deepEqual(res.value.unmountedInstanceIds, []);
  assert.deepEqual(
    res.value.nextChildren.map((c) => c.slotId),
    ["i:0", "i:1", "i:2"],
  );
});
