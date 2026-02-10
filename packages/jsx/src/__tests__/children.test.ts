import { ui } from "@rezi-ui/core";
import { assert, describe, test } from "@rezi-ui/testkit";
import {
  type JsxChildren,
  normalizeContainerChildren,
  normalizeTextChildren,
} from "../children.js";

describe("children normalization", () => {
  test("container children normalize undefined and a single vnode", () => {
    assert.deepEqual(normalizeContainerChildren(undefined), []);

    const child = ui.text("only");
    assert.deepEqual(normalizeContainerChildren(child), [child]);
  });

  test("container children filter booleans/null/undefined and flatten arrays", () => {
    const a = ui.text("a");
    const b = ui.text("b");
    const mixed: JsxChildren = [a, false, null, undefined, true, [b]];

    assert.deepEqual(normalizeContainerChildren(mixed), [a, b]);
  });

  test("container children preserve 0 and empty string as text nodes", () => {
    assert.deepEqual(normalizeContainerChildren([0, ""]), [ui.text("0"), ui.text("")]);
  });

  test("container children wrap strings/numbers and flatten deeply nested arrays", () => {
    const child = ui.text("vnode");
    const nested: JsxChildren = [[[["hello"]]], child, [42]];

    assert.deepEqual(normalizeContainerChildren(nested), [ui.text("hello"), child, ui.text("42")]);
  });

  test("text children normalize to a concatenated string", () => {
    assert.equal(normalizeTextChildren(undefined), "");
    assert.equal(normalizeTextChildren(["Count: ", 5]), "Count: 5");
    assert.equal(normalizeTextChildren(["A", ["B", ["C"]]]), "ABC");
    assert.equal(normalizeTextChildren([true, false, null, undefined, "x", 0]), "x0");
  });
});
