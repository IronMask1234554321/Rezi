import { assert, describe, test } from "@rezi-ui/testkit";
import { createTheme, defaultTheme, resolveColor, resolveSpacing } from "../index.js";

describe("theme", () => {
  test("createTheme merges colors and spacing", () => {
    const t = createTheme({
      colors: { primary: { r: 1, g: 2, b: 3 } },
      spacing: [0, 2, 4],
    });

    assert.equal(t.colors.primary.r, 1);
    assert.equal(t.colors.primary.g, 2);
    assert.equal(t.colors.primary.b, 3);
    assert.equal(t.colors.fg.r, defaultTheme.colors.fg.r);
    assert.deepEqual(t.spacing, [0, 2, 4]);
  });

  test("resolveColor returns theme color or fg fallback", () => {
    assert.deepEqual(resolveColor(defaultTheme, "primary"), defaultTheme.colors.primary);
    assert.deepEqual(resolveColor(defaultTheme, "missing"), defaultTheme.colors.fg);
    assert.deepEqual(resolveColor(defaultTheme, { r: 9, g: 8, b: 7 }), { r: 9, g: 8, b: 7 });
  });

  test("resolveSpacing maps indices and allows raw values", () => {
    const t = createTheme({ spacing: [0, 10, 20] });
    assert.equal(resolveSpacing(t, 0), 0);
    assert.equal(resolveSpacing(t, 1), 10);
    assert.equal(resolveSpacing(t, 2), 20);
    assert.equal(resolveSpacing(t, 5), 5);
  });
});
