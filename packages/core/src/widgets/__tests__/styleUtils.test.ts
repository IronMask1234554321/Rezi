import { assert, describe, test } from "@rezi-ui/testkit";
import { extendStyle, mergeStyles, styleWhen, styles } from "../styleUtils.js";

describe("styleUtils", () => {
  test("mergeStyles applies later overrides", () => {
    const a = { bold: true, fg: { r: 1, g: 1, b: 1 } } as const;
    const b = { bold: false } as const;
    const merged = mergeStyles(a, b);
    assert.equal(merged.bold, false);
    assert.deepEqual(merged.fg, { r: 1, g: 1, b: 1 });
  });

  test("extendStyle delegates to mergeStyles", () => {
    const base = { bold: true } as const;
    const ext = extendStyle(base, { dim: true });
    assert.equal(ext.bold, true);
    assert.equal(ext.dim, true);
  });

  test("styleWhen selects styles", () => {
    assert.deepEqual(styleWhen(true, styles.bold), styles.bold);
    assert.equal(styleWhen(false, styles.bold), undefined);
  });
});
