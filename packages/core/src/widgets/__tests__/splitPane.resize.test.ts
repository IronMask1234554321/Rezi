import { assert, describe, test } from "@rezi-ui/testkit";
import {
  collapsePanel,
  computePanelCellSizes,
  computePanelSizes,
  expandPanel,
  handleDividerDrag,
  sizesToPercentages,
} from "../splitPane.js";

describe("splitPane.resize - divider drag and keyboard-step semantics", () => {
  type DragCase = Readonly<{
    name: string;
    start: readonly number[];
    divider: number;
    delta: number;
    min?: readonly number[];
    max?: readonly number[];
    expected: readonly number[];
  }>;

  const dragCases: readonly DragCase[] = [
    {
      name: "positive delta shifts space to left panel",
      start: [40, 60] as const,
      divider: 0,
      delta: 10,
      expected: [50, 50],
    },
    {
      name: "negative delta shifts space to right panel",
      start: [40, 60] as const,
      divider: 0,
      delta: -10,
      expected: [30, 70],
    },
    {
      name: "clamps by left min",
      start: [10, 90] as const,
      divider: 0,
      delta: -20,
      min: [5, 0] as const,
      expected: [5, 95],
    },
    {
      name: "clamps by right min",
      start: [90, 10] as const,
      divider: 0,
      delta: 20,
      min: [0, 5] as const,
      expected: [95, 5],
    },
    {
      name: "clamps by left max",
      start: [40, 60] as const,
      divider: 0,
      delta: 50,
      max: [70, 100] as const,
      expected: [70, 30],
    },
    {
      name: "clamps by right max",
      start: [40, 60] as const,
      divider: 0,
      delta: -50,
      max: [100, 70] as const,
      expected: [30, 70],
    },
  ] as const;

  for (const c of dragCases) {
    test(`handleDividerDrag ${c.name}`, () => {
      const result = handleDividerDrag(c.start, c.divider, c.delta, c.min, c.max);
      assert.deepEqual(result, c.expected);
    });
  }

  test("invalid divider index returns original reference", () => {
    const start = Object.freeze([10, 20, 30]);
    assert.equal(handleDividerDrag(start, -1, 5), start);
    assert.equal(handleDividerDrag(start, 2, 5), start);
  });

  test("keyboard-like repeated drag steps are deterministic", () => {
    let sizes: readonly number[] = [50, 50];
    for (let i = 0; i < 5; i++) {
      sizes = handleDividerDrag(sizes, 0, 1, [10, 10], [90, 90]);
    }
    assert.deepEqual(sizes, [55, 45]);
  });

  test("drag preserves total size", () => {
    const start = [33, 67, 50] as const;
    const next = handleDividerDrag(start, 1, -12, [0, 0, 0], [100, 100, 100]);
    const totalStart = start.reduce((sum, value) => sum + value, 0);
    const totalNext = next.reduce((sum, value) => sum + value, 0);
    assert.equal(totalNext, totalStart);
  });
});

describe("splitPane.resize - collapse and expand", () => {
  test("collapsePanel collapses middle panel to min and transfers to left", () => {
    const collapsed = collapsePanel([30, 40, 30], 1, [10, 5, 10]);
    assert.deepEqual(collapsed, [65, 5, 30]);
  });

  test("collapsePanel on first panel transfers to right", () => {
    const collapsed = collapsePanel([30, 70], 0, [0, 0]);
    assert.deepEqual(collapsed, [0, 100]);
  });

  test("collapsePanel no-ops when already at min", () => {
    const start = Object.freeze([5, 95]);
    assert.equal(collapsePanel(start, 0, [5, 0]), start);
  });

  test("collapsePanel invalid index returns original reference", () => {
    const start = Object.freeze([20, 80]);
    assert.equal(collapsePanel(start, -1), start);
    assert.equal(collapsePanel(start, 2), start);
  });

  test("expandPanel grows from left neighbor", () => {
    const expanded = expandPanel([70, 30], 1, 50);
    assert.deepEqual(expanded, [50, 50]);
  });

  test("expandPanel grows from right neighbor when expanding first", () => {
    const expanded = expandPanel([20, 80], 0, 50);
    assert.deepEqual(expanded, [50, 50]);
  });

  test("expandPanel caps growth to available neighbor size", () => {
    const expanded = expandPanel([20, 5], 0, 60);
    assert.deepEqual(expanded, [25, 0]);
  });

  test("expandPanel no-ops when target is not larger", () => {
    const start = Object.freeze([20, 80]);
    assert.equal(expandPanel(start, 0, 10), start);
    assert.equal(expandPanel(start, 0, 20), start);
  });

  test("expandPanel invalid index returns original reference", () => {
    const start = Object.freeze([20, 80]);
    assert.equal(expandPanel(start, -1, 50), start);
    assert.equal(expandPanel(start, 3, 50), start);
  });
});

describe("splitPane.resize - sizing conversions", () => {
  test("computePanelSizes enforces min/max constraints", () => {
    const result = computePanelSizes([50, 50], 100, 1, [20, 10], [70, 90]);
    assert.deepEqual(result.sizes, [50, 49]);
    assert.deepEqual(result.dividerPositions, [50]);
  });

  test("computePanelCellSizes absolute mode uses integer truncation", () => {
    const result = computePanelCellSizes(3, [10.8, 20.4, 30.9], 80, "absolute", 1);
    assert.deepEqual(result.sizes, [16, 26, 36]);
  });

  test("sizesToPercentages handles zero total deterministically", () => {
    assert.deepEqual(sizesToPercentages([0, 0, 0]), [100 / 3, 100 / 3, 100 / 3]);
  });

  test("sizesToPercentages preserves proportional identity", () => {
    const percents = sizesToPercentages([20, 30, 50]);
    assert.equal(Math.round((percents[0] ?? 0) + (percents[1] ?? 0) + (percents[2] ?? 0)), 100);
    assert.equal(Math.round(percents[2] ?? 0), 50);
  });
});
