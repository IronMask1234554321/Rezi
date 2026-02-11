import { assert, describe, test } from "@rezi-ui/testkit";
import type { RuntimeBackend } from "../../backend.js";
import { ui } from "../../index.js";
import { DEFAULT_TERMINAL_CAPS } from "../../terminalCaps.js";
import { defaultTheme } from "../../theme/defaultTheme.js";
import { WidgetRenderer } from "../widgetRenderer.js";

function noRenderHooks(): { enterRender: () => void; exitRender: () => void } {
  return { enterRender: () => {}, exitRender: () => {} };
}

function createNoopBackend(): RuntimeBackend {
  return {
    start: async () => {},
    stop: async () => {},
    dispose: () => {},
    requestFrame: async () => {},
    pollEvents: async () =>
      new Promise((_) => {
        // Not used by WidgetRenderer unit-style tests.
      }),
    postUserEvent: () => {},
    getCaps: async () => DEFAULT_TERMINAL_CAPS,
  };
}

describe("layer zIndex clamping", () => {
  test("ui.layer zIndex is clamped to a safe integer range", () => {
    const backend = createNoopBackend();
    const renderer = new WidgetRenderer<void>({
      backend,
      requestRender: () => {},
    });

    const view = () =>
      ui.layers([
        ui.text("base"),
        ui.layer({
          id: "a",
          zIndex: Number.MAX_SAFE_INTEGER,
          content: ui.text("A"),
        }),
        ui.layer({
          id: "b",
          zIndex: Number.MAX_SAFE_INTEGER,
          content: ui.text("B"),
        }),
      ]);

    const res = renderer.submitFrame(
      () => view(),
      undefined,
      { cols: 20, rows: 6 },
      defaultTheme,
      noRenderHooks(),
    );
    assert.ok(res.ok);

    const internal = renderer as unknown as {
      layerRegistry: {
        getAll: () => readonly Readonly<{ id: string; zIndex: number }>[];
      };
    };
    const layers = internal.layerRegistry.getAll();

    const a = layers.find((l) => l.id === "a");
    const b = layers.find((l) => l.id === "b");
    assert.ok(a);
    assert.ok(b);

    // Should not overflow safe integer range (JS precision would collapse ordering).
    assert.ok(Number.isSafeInteger(a.zIndex));
    assert.ok(Number.isSafeInteger(b.zIndex));
    assert.ok(a.zIndex <= Number.MAX_SAFE_INTEGER);
    assert.ok(b.zIndex <= Number.MAX_SAFE_INTEGER);

    // Later children should render on top when clamped to the same base z-index.
    assert.ok(a.zIndex < b.zIndex);

    const scale = 1_000_000;
    const maxBase = Math.floor((Number.MAX_SAFE_INTEGER - (scale - 1)) / scale);
    assert.equal(Math.trunc(a.zIndex / scale), maxBase);
    assert.equal(Math.trunc(b.zIndex / scale), maxBase);
  });
});
