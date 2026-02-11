import { assert, describe, test } from "@rezi-ui/testkit";
import { resolveMargin } from "../spacing.js";
import { validateBoxProps, validateStackProps } from "../validateProps.js";

describe("spacing", () => {
  test("resolveMargin: mt/mr/mb/ml overrides mx/my/m", () => {
    const out = resolveMargin({ m: 1, mx: 2, my: 3, mt: 4, ml: 5 });
    assert.deepEqual(out, { top: 4, right: 2, bottom: 3, left: 5 });
  });

  test("validateBoxProps: accepts spacing keys (p/m + legacy pad)", () => {
    const res = validateBoxProps({ p: "md", mx: "lg", mt: "sm", pad: "sm" });
    assert.equal(res.ok, true);
    if (!res.ok) throw new Error("expected ok");
    assert.equal(res.value.p, 2);
    assert.equal(res.value.mx, 3);
    assert.equal(res.value.mt, 1);
    assert.equal(res.value.pad, 1);
  });

  test("validateStackProps(row): accepts spacing keys (gap/p/m)", () => {
    const res = validateStackProps("row", { gap: "sm", p: "md", m: "sm" });
    assert.equal(res.ok, true);
    if (!res.ok) throw new Error("expected ok");
    assert.equal(res.value.gap, 1);
    assert.equal(res.value.p, 2);
    assert.equal(res.value.m, 1);
  });

  test("validateStackProps(column): accepts spacing keys (gap + legacy pad)", () => {
    const res = validateStackProps("column", { gap: "sm", pad: "md", px: "lg", my: "sm" });
    assert.equal(res.ok, true);
    if (!res.ok) throw new Error("expected ok");
    assert.equal(res.value.gap, 1);
    assert.equal(res.value.pad, 2);
    assert.equal(res.value.px, 3);
    assert.equal(res.value.my, 1);
  });
});
