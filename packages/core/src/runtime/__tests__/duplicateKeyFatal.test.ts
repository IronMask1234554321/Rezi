import { assert, test } from "@rezi-ui/testkit";
import type { VNode } from "../../index.js";
import { createInstanceIdAllocator } from "../instance.js";
import { reconcileChildren } from "../reconcile.js";

function textVNode(text: string, key: string): VNode {
  return { kind: "text", text, props: { key } };
}

function spacerVNode(key: string): VNode {
  return { kind: "spacer", props: { key } };
}

test("duplicate sibling keys trigger deterministic fatal ZRUI_DUPLICATE_KEY (#65)", () => {
  const allocator = createInstanceIdAllocator(1);
  const nextChildren = [textVNode("a", "dup"), spacerVNode("dup")];

  const res = reconcileChildren(42, [], nextChildren, allocator);
  assert.equal(res.ok, false);
  if (res.ok) return;

  assert.equal(res.fatal.code, "ZRUI_DUPLICATE_KEY");
  assert.equal(
    res.fatal.detail,
    'duplicate sibling key "dup" under parent instanceId=42 (child indices 0 and 1)',
  );
});
