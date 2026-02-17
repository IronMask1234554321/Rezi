import { assert, describe, test } from "@rezi-ui/testkit";
import { DEFAULT_BASE_STYLE, mergeTextStyle } from "../../renderer/renderToDrawlist/textStyle.js";
import { styled } from "../styled.js";

describe("TextStyle merge with strikethrough", () => {
  test("nested inheritance chain preserves and overrides strikethrough deterministically", () => {
    const root = mergeTextStyle(DEFAULT_BASE_STYLE, { strikethrough: true });
    const parent = mergeTextStyle(root, { bold: true });
    const child = mergeTextStyle(parent, { strikethrough: false });
    const leaf = mergeTextStyle(child, { italic: true });

    assert.equal(root.strikethrough, true);
    assert.equal(parent.strikethrough, true);
    assert.equal(child.strikethrough, false);
    assert.equal(leaf.strikethrough, false);
  });

  test("cache key distinguishes strikethrough from other boolean attrs", () => {
    const withoutStrike = mergeTextStyle(DEFAULT_BASE_STYLE, { bold: true });
    const withStrikeA = mergeTextStyle(DEFAULT_BASE_STYLE, { bold: true, strikethrough: true });
    const withStrikeB = mergeTextStyle(DEFAULT_BASE_STYLE, { bold: true, strikethrough: true });

    assert.equal(withoutStrike === withStrikeA, false);
    assert.equal(withStrikeA === withStrikeB, true);
  });
});

describe("styled variant merge with strikethrough", () => {
  test("base -> variant -> user style merge order supports strikethrough overrides", () => {
    const Button = styled("button", {
      base: { bold: true, strikethrough: true },
      variants: {
        intent: {
          primary: { fg: { r: 1, g: 2, b: 3 } },
          danger: { fg: { r: 9, g: 8, b: 7 }, strikethrough: false },
        },
      },
      defaults: { intent: "primary" },
    });

    const defaultNode = Button({ id: "default", label: "Default" });
    assert.deepEqual((defaultNode.props as { style?: unknown }).style, {
      bold: true,
      strikethrough: true,
      fg: { r: 1, g: 2, b: 3 },
    });

    const dangerNode = Button({
      id: "danger",
      label: "Danger",
      intent: "danger",
      style: { strikethrough: true, italic: true },
    });
    assert.deepEqual((dangerNode.props as { style?: unknown }).style, {
      bold: true,
      fg: { r: 9, g: 8, b: 7 },
      strikethrough: true,
      italic: true,
    });
  });
});
