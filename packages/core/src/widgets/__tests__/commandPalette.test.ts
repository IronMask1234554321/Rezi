import { assert, test } from "@rezi-ui/testkit";
import { computeCommandPaletteWindow } from "../commandPalette.js";

test("commandPalette: computeCommandPaletteWindow keeps selection visible", () => {
  assert.deepEqual(computeCommandPaletteWindow(0, 0, 10), { start: 0, count: 0 });
  assert.deepEqual(computeCommandPaletteWindow(0, 5, 10), { start: 0, count: 5 });

  assert.deepEqual(computeCommandPaletteWindow(0, 20, 10), { start: 0, count: 10 });
  assert.deepEqual(computeCommandPaletteWindow(5, 20, 10), { start: 0, count: 10 });
  assert.deepEqual(computeCommandPaletteWindow(10, 20, 10), { start: 5, count: 10 });
  assert.deepEqual(computeCommandPaletteWindow(15, 20, 10), { start: 10, count: 10 });

  assert.deepEqual(computeCommandPaletteWindow(-5, 20, 10), { start: 0, count: 10 });
  assert.deepEqual(computeCommandPaletteWindow(999, 20, 10), { start: 10, count: 10 });
});
