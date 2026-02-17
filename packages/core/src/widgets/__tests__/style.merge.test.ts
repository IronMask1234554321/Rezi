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

describe("TextStyle merge with overline", () => {
  test("nested inheritance chain preserves and overrides overline deterministically", () => {
    const root = mergeTextStyle(DEFAULT_BASE_STYLE, { overline: true });
    const parent = mergeTextStyle(root, { bold: true });
    const child = mergeTextStyle(parent, { overline: false });
    const leaf = mergeTextStyle(child, { italic: true });

    assert.equal(root.overline, true);
    assert.equal(parent.overline, true);
    assert.equal(child.overline, false);
    assert.equal(leaf.overline, false);
  });

  test("cache key distinguishes overline from other boolean attrs", () => {
    const withoutOverline = mergeTextStyle(DEFAULT_BASE_STYLE, { bold: true });
    const withOverlineA = mergeTextStyle(DEFAULT_BASE_STYLE, { bold: true, overline: true });
    const withOverlineB = mergeTextStyle(DEFAULT_BASE_STYLE, { bold: true, overline: true });
    const withStrike = mergeTextStyle(DEFAULT_BASE_STYLE, { bold: true, strikethrough: true });

    assert.equal(withoutOverline === withOverlineA, false);
    assert.equal(withOverlineA === withOverlineB, true);
    assert.equal(withOverlineA === withStrike, false);
  });
});

describe("styled variant merge with overline", () => {
  test("base -> variant -> user style merge order supports overline application and overrides", () => {
    const Button = styled("button", {
      base: { bold: true, overline: true },
      variants: {
        intent: {
          primary: { fg: { r: 1, g: 2, b: 3 } },
          danger: { fg: { r: 9, g: 8, b: 7 }, overline: false },
        },
      },
      defaults: { intent: "primary" },
    });

    const defaultNode = Button({ id: "default", label: "Default" });
    assert.deepEqual((defaultNode.props as { style?: unknown }).style, {
      bold: true,
      overline: true,
      fg: { r: 1, g: 2, b: 3 },
    });

    const dangerNode = Button({
      id: "danger",
      label: "Danger",
      intent: "danger",
      style: { overline: true, italic: true },
    });
    assert.deepEqual((dangerNode.props as { style?: unknown }).style, {
      bold: true,
      fg: { r: 9, g: 8, b: 7 },
      overline: true,
      italic: true,
    });
  });
});

describe("TextStyle merge with blink", () => {
  test("nested inheritance chain preserves and overrides blink deterministically", () => {
    const root = mergeTextStyle(DEFAULT_BASE_STYLE, { blink: true });
    const parent = mergeTextStyle(root, { bold: true });
    const child = mergeTextStyle(parent, { blink: false });
    const leaf = mergeTextStyle(child, { italic: true });

    assert.equal(root.blink, true);
    assert.equal(parent.blink, true);
    assert.equal(child.blink, false);
    assert.equal(leaf.blink, false);
  });

  test("cache key distinguishes blink from other boolean attrs", () => {
    const withoutBlink = mergeTextStyle(DEFAULT_BASE_STYLE, { bold: true });
    const withBlinkA = mergeTextStyle(DEFAULT_BASE_STYLE, { bold: true, blink: true });
    const withBlinkB = mergeTextStyle(DEFAULT_BASE_STYLE, { bold: true, blink: true });
    const withOverline = mergeTextStyle(DEFAULT_BASE_STYLE, { bold: true, overline: true });

    assert.equal(withoutBlink === withBlinkA, false);
    assert.equal(withBlinkA === withBlinkB, true);
    assert.equal(withBlinkA === withOverline, false);
  });
});

describe("styled variant merge with blink", () => {
  test("base -> variant -> user style merge order supports blink application and overrides", () => {
    const Button = styled("button", {
      base: { bold: true, blink: true },
      variants: {
        intent: {
          primary: { fg: { r: 1, g: 2, b: 3 } },
          danger: { fg: { r: 9, g: 8, b: 7 }, blink: false },
        },
      },
      defaults: { intent: "primary" },
    });

    const defaultNode = Button({ id: "default", label: "Default" });
    assert.deepEqual((defaultNode.props as { style?: unknown }).style, {
      bold: true,
      blink: true,
      fg: { r: 1, g: 2, b: 3 },
    });

    const dangerNode = Button({
      id: "danger",
      label: "Danger",
      intent: "danger",
      style: { blink: true, italic: true },
    });
    assert.deepEqual((dangerNode.props as { style?: unknown }).style, {
      bold: true,
      fg: { r: 9, g: 8, b: 7 },
      blink: true,
      italic: true,
    });
  });
});
