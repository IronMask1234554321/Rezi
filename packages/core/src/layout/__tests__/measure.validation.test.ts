import { assert, test } from "@rezi-ui/testkit";
import type { VNode } from "../../index.js";
import { measure } from "../layout.js";

test("measure validates subtree even when remaining space is 0 (locked)", () => {
  const badButton = {
    kind: "button",
    props: { id: 123, label: "x" },
  } as unknown as VNode;

  const tree: VNode = { kind: "row", props: {}, children: [badButton] };

  const res = measure(tree, 0, 0, "row");
  assert.equal(res.ok, false);
  if (res.ok) return;

  assert.equal(res.fatal.code, "ZRUI_INVALID_PROPS");
  assert.equal(res.fatal.detail, "button.id must be a string");
});
