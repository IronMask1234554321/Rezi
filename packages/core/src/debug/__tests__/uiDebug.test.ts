import { assert, describe, test } from "@rezi-ui/testkit";
import { ui } from "../../widgets/ui.js";
import { debug, inspect } from "../debug.js";

describe("debug (UI helpers)", () => {
  test("debug wraps node in a box with a title when id present", () => {
    const n = ui.button({ id: "btn", label: "B" });
    const v = debug(n);
    assert.equal(v.kind, "box");
    assert.equal((v.props as { title?: unknown }).title, " btn ");
    assert.equal(v.children.length, 1);
  });

  test("inspect returns dimmed text", () => {
    const v = inspect({ a: 1 });
    assert.equal(v.kind, "text");
    assert.equal(((v.props as { style?: unknown }).style as { dim?: boolean }).dim, true);
  });
});
