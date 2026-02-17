import { assert, describe, test } from "@rezi-ui/testkit";
import type { TextStyle } from "../../index.js";
import { mergeStyles, styles } from "../styleUtils.js";

describe("TextStyle attributes", () => {
  test("supports strikethrough on TextStyle", () => {
    const style: TextStyle = { bold: true, strikethrough: true };
    assert.equal(style.bold, true);
    assert.equal(style.strikethrough, true);
  });

  test("supports overline on TextStyle", () => {
    const style: TextStyle = { bold: true, overline: true };
    assert.equal(style.bold, true);
    assert.equal(style.overline, true);
  });

  test("supports blink on TextStyle", () => {
    const style: TextStyle = { bold: true, blink: true };
    assert.equal(style.bold, true);
    assert.equal(style.blink, true);
  });

  test("style presets include strikethrough", () => {
    assert.deepEqual(styles.strikethrough, { strikethrough: true });
  });

  test("style presets include overline", () => {
    assert.deepEqual(styles.overline, { overline: true });
  });

  test("style presets include blink", () => {
    assert.deepEqual(styles.blink, { blink: true });
  });

  test("mergeStyles keeps existing attrs behavior when strikethrough is present", () => {
    const merged = mergeStyles(
      { bold: true, underline: true, strikethrough: true },
      { dim: true, strikethrough: false },
      { italic: true },
    );
    assert.deepEqual(merged, {
      bold: true,
      dim: true,
      italic: true,
      underline: true,
      strikethrough: false,
    });
  });

  test("mergeStyles keeps existing attrs behavior when overline is present", () => {
    const merged = mergeStyles(
      { bold: true, underline: true, overline: true },
      { dim: true, overline: false },
      { italic: true },
    );
    assert.deepEqual(merged, {
      bold: true,
      dim: true,
      italic: true,
      underline: true,
      overline: false,
    });
  });

  test("mergeStyles keeps existing attrs behavior when blink is present", () => {
    const merged = mergeStyles(
      { bold: true, underline: true, blink: true },
      { dim: true, blink: false },
      { italic: true },
    );
    assert.deepEqual(merged, {
      bold: true,
      dim: true,
      italic: true,
      underline: true,
      blink: false,
    });
  });
});
