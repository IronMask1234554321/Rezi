import { assert, describe, test } from "@rezi-ui/testkit";
import type { TextStyle } from "../../index.js";
import { DEFAULT_BASE_STYLE, mergeTextStyle } from "../renderToDrawlist/textStyle.js";

const BOOL_ATTRS = [
  "bold",
  "dim",
  "italic",
  "underline",
  "inverse",
  "strikethrough",
  "overline",
  "blink",
] as const;

type BoolAttr = (typeof BOOL_ATTRS)[number];

const TRI_KEY_SPACE = 3 ** BOOL_ATTRS.length;

const ALL_TRUE: TextStyle = {
  bold: true,
  dim: true,
  italic: true,
  underline: true,
  inverse: true,
  strikethrough: true,
  overline: true,
  blink: true,
};

const ALL_FALSE: TextStyle = {
  bold: false,
  dim: false,
  italic: false,
  underline: false,
  inverse: false,
  strikethrough: false,
  overline: false,
  blink: false,
};

function styleFromTriCode(code: number): TextStyle {
  const out: Partial<Record<BoolAttr, boolean>> = {};
  let n = code;

  for (let idx = 0; idx < BOOL_ATTRS.length; idx++) {
    const digit = n % 3;
    n = Math.floor(n / 3);
    const attr = BOOL_ATTRS[idx];
    if (!attr) throw new Error(`missing attr at index ${String(idx)}`);
    if (digit === 1) out[attr] = false;
    if (digit === 2) out[attr] = true;
  }

  return out;
}

describe("mergeTextStyle default-base cache hardening", () => {
  test("undefined override returns base by identity", () => {
    const merged = mergeTextStyle(DEFAULT_BASE_STYLE, undefined);
    assert.equal(merged === DEFAULT_BASE_STYLE, true);
  });

  test("all explicit undefined attrs collapse to base by identity", () => {
    const merged = mergeTextStyle(DEFAULT_BASE_STYLE, {
      bold: undefined,
      dim: undefined,
      italic: undefined,
      underline: undefined,
      inverse: undefined,
      strikethrough: undefined,
      overline: undefined,
      blink: undefined,
    } as unknown as TextStyle);
    assert.equal(merged === DEFAULT_BASE_STYLE, true);
  });

  test("all attrs true signature is cached and stable", () => {
    const a = mergeTextStyle(DEFAULT_BASE_STYLE, ALL_TRUE);
    const b = mergeTextStyle(DEFAULT_BASE_STYLE, { ...ALL_TRUE });

    assert.equal(a === DEFAULT_BASE_STYLE, false);
    assert.equal(a === b, true);
    for (const attr of BOOL_ATTRS) assert.equal(a[attr], true);
  });

  test("all attrs false signature is cached, stable, and distinct from all-true", () => {
    const allFalseA = mergeTextStyle(DEFAULT_BASE_STYLE, ALL_FALSE);
    const allFalseB = mergeTextStyle(DEFAULT_BASE_STYLE, { ...ALL_FALSE });
    const allTrue = mergeTextStyle(DEFAULT_BASE_STYLE, ALL_TRUE);

    assert.equal(allFalseA === DEFAULT_BASE_STYLE, false);
    assert.equal(allFalseA === allFalseB, true);
    assert.equal(allFalseA === allTrue, false);
    for (const attr of BOOL_ATTRS) assert.equal(allFalseA[attr], false);
  });

  test("explicit undefined fields do not create a separate cache key", () => {
    const canonical = mergeTextStyle(DEFAULT_BASE_STYLE, {
      bold: true,
      dim: false,
      strikethrough: true,
      blink: false,
    });
    const withUndefinedNoise = mergeTextStyle(DEFAULT_BASE_STYLE, {
      bold: true,
      dim: false,
      italic: undefined,
      underline: undefined,
      inverse: undefined,
      strikethrough: true,
      overline: undefined,
      blink: false,
    } as unknown as TextStyle);

    assert.equal(canonical === withUndefinedNoise, true);
  });

  test("cache key is independent of override object insertion order", () => {
    const a = mergeTextStyle(DEFAULT_BASE_STYLE, {
      bold: true,
      overline: true,
      inverse: false,
      blink: true,
      strikethrough: false,
    });
    const b = mergeTextStyle(DEFAULT_BASE_STYLE, {
      blink: true,
      strikethrough: false,
      inverse: false,
      overline: true,
      bold: true,
    });

    assert.equal(a === b, true);
  });

  test("full 3^8 tri-state keyspace has unique refs and stable second-pass hits", () => {
    const firstPass: Array<ReturnType<typeof mergeTextStyle>> = new Array(TRI_KEY_SPACE);

    for (let code = 0; code < TRI_KEY_SPACE; code++) {
      firstPass[code] = mergeTextStyle(DEFAULT_BASE_STYLE, styleFromTriCode(code));
    }

    const refs = new Set(firstPass);
    assert.equal(refs.size, TRI_KEY_SPACE);

    for (let code = 0; code < TRI_KEY_SPACE; code++) {
      const again = mergeTextStyle(DEFAULT_BASE_STYLE, styleFromTriCode(code));
      assert.equal(again === firstPass[code], true);
    }
  });

  test("heavy churn across full keyspace does not stale or evict sentinel entries", () => {
    const sentinelA: TextStyle = { bold: true, strikethrough: false, blink: true };
    const sentinelB: TextStyle = { dim: false, italic: true, overline: true, inverse: false };

    const a0 = mergeTextStyle(DEFAULT_BASE_STYLE, sentinelA);
    const b0 = mergeTextStyle(DEFAULT_BASE_STYLE, sentinelB);

    for (let code = 0; code < TRI_KEY_SPACE; code++) {
      mergeTextStyle(DEFAULT_BASE_STYLE, styleFromTriCode(code));
    }

    const a1 = mergeTextStyle(DEFAULT_BASE_STYLE, sentinelA);
    const b1 = mergeTextStyle(DEFAULT_BASE_STYLE, sentinelB);

    assert.equal(a1 === a0, true);
    assert.equal(b1 === b0, true);
    assert.equal(a1.bold, true);
    assert.equal(a1.strikethrough, false);
    assert.equal(a1.blink, true);
    assert.equal(b1.dim, false);
    assert.equal(b1.italic, true);
    assert.equal(b1.overline, true);
    assert.equal(b1.inverse, false);
  });

  test("new attrs (strikethrough, overline, blink) never alias each other", () => {
    const strike = mergeTextStyle(DEFAULT_BASE_STYLE, { strikethrough: true });
    const overline = mergeTextStyle(DEFAULT_BASE_STYLE, { overline: true });
    const blink = mergeTextStyle(DEFAULT_BASE_STYLE, { blink: true });

    assert.equal(strike === overline, false);
    assert.equal(strike === blink, false);
    assert.equal(overline === blink, false);
  });

  test("new attrs preserve tri-state separation (unset, false, true)", () => {
    const attrs: BoolAttr[] = ["strikethrough", "overline", "blink"];

    for (const attr of attrs) {
      const unset = mergeTextStyle(DEFAULT_BASE_STYLE, {});
      const falsy = mergeTextStyle(DEFAULT_BASE_STYLE, { [attr]: false } as TextStyle);
      const truthy = mergeTextStyle(DEFAULT_BASE_STYLE, { [attr]: true } as TextStyle);

      assert.equal(unset === DEFAULT_BASE_STYLE, true);
      assert.equal(unset === falsy, false);
      assert.equal(unset === truthy, false);
      assert.equal(falsy === truthy, false);

      const falsyAgain = mergeTextStyle(DEFAULT_BASE_STYLE, { [attr]: false } as TextStyle);
      const truthyAgain = mergeTextStyle(DEFAULT_BASE_STYLE, { [attr]: true } as TextStyle);
      assert.equal(falsyAgain === falsy, true);
      assert.equal(truthyAgain === truthy, true);
    }
  });

  test("cached default-base entries are frozen", () => {
    const cached = mergeTextStyle(DEFAULT_BASE_STYLE, {
      bold: true,
      strikethrough: true,
      overline: false,
      blink: true,
    });

    assert.equal(Object.isFrozen(cached), true);
  });

  test("frozen cache entries resist mutation poisoning across cache hits", () => {
    const key: TextStyle = { bold: true, overline: true, blink: false };
    const cached = mergeTextStyle(DEFAULT_BASE_STYLE, key);

    try {
      (cached as { bold?: boolean }).bold = false;
      (cached as { overline?: boolean }).overline = false;
    } catch {
      // strict-mode assignment to frozen object can throw; both outcomes are acceptable
    }

    const again = mergeTextStyle(DEFAULT_BASE_STYLE, key);
    assert.equal(again === cached, true);
    assert.equal(again.bold, true);
    assert.equal(again.overline, true);
    assert.equal(again.blink, false);
  });

  test("deterministic workload sustains >95% cache hit rate", () => {
    const hotCodeCount = 96;
    const hotCodes: number[] = [];
    for (let i = 0; i < hotCodeCount; i++) {
      hotCodes.push((i * 67 + 19) % TRI_KEY_SPACE);
    }

    const callsPerCode = 100;
    const totalCalls = hotCodes.length * callsPerCode;
    const byCode = new Map<number, ReturnType<typeof mergeTextStyle>>();
    let hits = 0;

    for (let i = 0; i < totalCalls; i++) {
      const code = hotCodes[(i * 37 + 11) % hotCodes.length] as number;
      const merged = mergeTextStyle(DEFAULT_BASE_STYLE, styleFromTriCode(code));
      const prior = byCode.get(code);
      if (prior === undefined) {
        byCode.set(code, merged);
      } else if (prior === merged) {
        hits++;
      } else {
        byCode.set(code, merged);
      }
    }

    const hitRate = hits / totalCalls;
    assert.equal(byCode.size, hotCodes.length);
    assert.equal(hitRate > 0.95, true);
  });
});
