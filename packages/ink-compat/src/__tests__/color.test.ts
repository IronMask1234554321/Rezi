import { assert, describe, test } from "@rezi-ui/testkit";
import { __private, resolveInkColor } from "../color.js";

describe("color: resolveInkColor()", () => {
  test("named colors (ansi16)", () => {
    assert.deepEqual(resolveInkColor("red"), { r: 128, g: 0, b: 0 });
    assert.deepEqual(resolveInkColor("redBright"), { r: 255, g: 0, b: 0 });
    assert.deepEqual(resolveInkColor("gray"), { r: 128, g: 128, b: 128 });
  });

  test("hex colors (#RRGGBB)", () => {
    assert.deepEqual(resolveInkColor("#ff00aa"), { r: 255, g: 0, b: 170 });
    assert.deepEqual(resolveInkColor("#fff"), { r: 255, g: 255, b: 255 });
    assert.equal(resolveInkColor("ff00aa"), undefined);
    assert.equal(resolveInkColor("#ff000080"), undefined);
  });

  test("rgb(r,g,b)", () => {
    assert.deepEqual(resolveInkColor("rgb(1,2,3)"), { r: 1, g: 2, b: 3 });
    assert.deepEqual(resolveInkColor("rgb( 4, 5, 6 )"), { r: 4, g: 5, b: 6 });
  });

  test("ansi256(n)", () => {
    assert.deepEqual(resolveInkColor("ansi256(196)"), { r: 255, g: 0, b: 0 });
    assert.deepEqual(resolveInkColor("ansi256(232)"), { r: 8, g: 8, b: 8 });
    assert.deepEqual(resolveInkColor("ansi256(255)"), { r: 238, g: 238, b: 238 });
  });

  test("invalid strings return undefined", () => {
    assert.equal(resolveInkColor(undefined), undefined);
    assert.equal(resolveInkColor("nope"), undefined);
    assert.equal(resolveInkColor("rgb(a,b,c)"), undefined);
    assert.equal(resolveInkColor("ansi256(x)"), undefined);
  });
});

describe("color: __private.ansi256ToRgb()", () => {
  test("rejects out of range values", () => {
    assert.equal(__private.ansi256ToRgb(-1), undefined);
    assert.equal(__private.ansi256ToRgb(256), undefined);
  });
});
