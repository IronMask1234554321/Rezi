import { assert, describe, test } from "@rezi-ui/testkit";
import { ui } from "../ui.js";

describe("data visualization widgets - edge cases", () => {
  test("sparkline preserves min/max and accepts empty data", () => {
    const populated = ui.sparkline([0, 1, Number.NaN, Number.POSITIVE_INFINITY], {
      width: 8,
      min: -1,
      max: 2,
    });
    assert.equal(populated.kind, "sparkline");
    assert.deepEqual(populated.props, {
      data: [0, 1, Number.NaN, Number.POSITIVE_INFINITY],
      width: 8,
      min: -1,
      max: 2,
    });

    const empty = ui.sparkline([]);
    assert.equal(empty.kind, "sparkline");
    assert.deepEqual(empty.props, { data: [] });
  });

  test("barChart preserves variants and supports empty arrays", () => {
    const vnode = ui.barChart(
      [
        { label: "A", value: 1, variant: "default" },
        { label: "B", value: 2, variant: "success" },
        { label: "C", value: 3, variant: "warning" },
        { label: "D", value: 4, variant: "error" },
        { label: "E", value: 5, variant: "info" },
      ],
      {
        orientation: "vertical",
        showValues: false,
        showLabels: true,
        maxBarLength: 1000,
      },
    );

    assert.equal(vnode.kind, "barChart");
    assert.equal(vnode.props.data.length, 5);
    assert.equal(vnode.props.orientation, "vertical");
    assert.equal(vnode.props.maxBarLength, 1000);

    const empty = ui.barChart([]);
    assert.equal(empty.kind, "barChart");
    assert.deepEqual(empty.props, { data: [] });
  });

  test("miniChart supports large arrays and optional max values", () => {
    const values = Array.from({ length: 50 }, (_, i) => ({
      label: `M${String(i)}`,
      value: i,
      max: 100,
    }));
    const vnode = ui.miniChart(values, { variant: "pills" });
    assert.equal(vnode.kind, "miniChart");
    assert.equal(vnode.props.values.length, 50);
    assert.equal(vnode.props.variant, "pills");

    const noMax = ui.miniChart([{ label: "CPU", value: 42 }]);
    assert.equal(noMax.kind, "miniChart");
    assert.deepEqual(noMax.props, { values: [{ label: "CPU", value: 42 }] });
  });
});
