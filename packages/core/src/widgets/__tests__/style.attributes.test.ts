import { assert, describe, test } from "@rezi-ui/testkit";
import type { TextStyle } from "../../index.js";
import { mergeStyles, styles } from "../styleUtils.js";

describe("TextStyle attributes", () => {
  test("supports strikethrough on TextStyle", () => {
    const style: TextStyle = { bold: true, strikethrough: true };
    assert.equal(style.bold, true);
    assert.equal(style.strikethrough, true);
  });

  test("style presets include strikethrough", () => {
    assert.deepEqual(styles.strikethrough, { strikethrough: true });
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
});
