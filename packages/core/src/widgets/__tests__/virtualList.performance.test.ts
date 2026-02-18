import { assert, describe, test } from "@rezi-ui/testkit";
import type { ZrevEvent } from "../../events.js";
import { routeVirtualListWheel } from "../../runtime/router.js";
import type { VirtualListWheelCtx } from "../../runtime/router/types.js";
import { computeVisibleRange } from "../virtualList.js";

function wheelEvent(wheelY: number): ZrevEvent {
  return {
    kind: "mouse",
    timeMs: 0,
    x: 0,
    y: 0,
    mouseKind: 5,
    mods: 0,
    buttons: 0,
    wheelX: 0,
    wheelY,
  };
}

describe("virtualList.performance - deterministic virtualization invariants", () => {
  test("100k fixed-height list renders only viewport+overscan window", () => {
    const items = Array.from({ length: 100_000 }, (_, i) => i);
    const range = computeVisibleRange(items, 1, 50_000, 40, 5);
    assert.equal(range.startIndex, 49_995);
    assert.equal(range.endIndex, 50_045);
    assert.equal(range.endIndex - range.startIndex, 50);
  });

  test("10k variable-height list keeps offset table deterministic", () => {
    const items = Array.from({ length: 10_000 }, (_, i) => ({ h: (i % 4) + 1 }));
    const range = computeVisibleRange(items, (it) => it.h, 20_000, 80, 8);
    assert.equal(range.itemOffsets.length, 10_001);
    assert.ok((range.itemOffsets[10_000] ?? 0) > 0);
    assert.ok(range.startIndex < range.endIndex);
  });

  test("rapid fixed-height scroll sequence remains monotonic and bounded", () => {
    const items = Array.from({ length: 20_000 }, (_, i) => i);
    const scrollTops = [0, 5, 12, 13, 999, 2_500, 19_990, 100_000];
    let previousStart = -1;

    for (const scrollTop of scrollTops) {
      const range = computeVisibleRange(items, 1, scrollTop, 20, 2);
      assert.ok(range.startIndex >= 0);
      assert.ok(range.endIndex <= items.length);
      assert.ok(range.startIndex <= range.endIndex);
      assert.ok(range.startIndex >= previousStart);
      previousStart = range.startIndex;
    }
  });

  test("rapid wheel scrolling never underflows or overflows", () => {
    const ctx: VirtualListWheelCtx = { scrollTop: 0, totalHeight: 1_000, viewportHeight: 25 };
    let scrollTop = ctx.scrollTop;

    for (const dy of [1, 1, 5, 10, -1, -50, 100]) {
      const result = routeVirtualListWheel(wheelEvent(dy), {
        scrollTop,
        totalHeight: ctx.totalHeight,
        viewportHeight: ctx.viewportHeight,
      });
      scrollTop = result.nextScrollTop ?? scrollTop;
      assert.ok(scrollTop >= 0);
      assert.ok(scrollTop <= 975);
    }
  });

  test("bottom-clamped range is stable across repeated recomputation", () => {
    const items = Array.from({ length: 4_096 }, (_, i) => i);
    const first = computeVisibleRange(items, 2, 999_999, 30, 4);
    const second = computeVisibleRange(items, 2, 999_999, 30, 4);
    assert.equal(first.startIndex, second.startIndex);
    assert.equal(first.endIndex, second.endIndex);
  });

  test("window size remains bounded for large overscan inputs", () => {
    const items = Array.from({ length: 50_000 }, (_, i) => i);
    const range = computeVisibleRange(items, 1, 1_000, 20, 10_000);
    assert.equal(range.startIndex, 0);
    assert.equal(range.endIndex, 11_020);
    assert.ok(range.endIndex <= items.length);
  });
});
