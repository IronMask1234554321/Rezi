import { assert, test } from "@rezi-ui/testkit";
import type { RuntimeBackend } from "../../backend.js";
import type { DrawlistBuilderV1 } from "../../drawlist/index.js";
import { DEFAULT_TERMINAL_CAPS } from "../../terminalCaps.js";
import { RawRenderer } from "../rawRenderer.js";

function makeStubBuilder(bytes: Uint8Array): DrawlistBuilderV1 {
  let built = false;
  return {
    clear(): void {},
    clearTo(): void {},
    fillRect(): void {},
    drawText(): void {},
    pushClip(): void {},
    popClip(): void {},
    addBlob(): number | null {
      return null;
    },
    addTextRunBlob(): number | null {
      return null;
    },
    drawTextRun(): void {},
    reset(): void {
      built = false;
    },
    build() {
      if (built)
        return { ok: false, error: { code: "ZRDL_INTERNAL", detail: "built twice" } } as const;
      built = true;
      return { ok: true, bytes } as const;
    },
  };
}

test("raw render pipeline submits bytes after draw returns (#61)", async () => {
  const seen: string[] = [];
  let inDraw = false;

  const backend: RuntimeBackend = {
    start: () => Promise.resolve(),
    stop: () => Promise.resolve(),
    dispose: () => undefined,
    pollEvents: () => new Promise(() => undefined),
    postUserEvent: () => undefined,
    requestFrame: (dl) => {
      seen.push(`request:${dl.byteLength}:${inDraw ? 1 : 0}`);
      return Promise.resolve();
    },
    getCaps: () => Promise.resolve(DEFAULT_TERMINAL_CAPS),
  };

  const renderer = new RawRenderer({
    backend,
    builder: makeStubBuilder(new Uint8Array([1, 2, 3])),
  });
  const res = renderer.submitFrame(
    (g) => {
      inDraw = true;
      seen.push("draw");
      g.clear();
      inDraw = false;
    },
    {
      enterRender: () => seen.push("enter"),
      exitRender: () => seen.push("exit"),
    },
  );

  assert.equal(res.ok, true);
  if (res.ok) await res.inFlight;

  assert.deepEqual(seen, ["enter", "draw", "exit", "request:3:0"]);
});

test("drawlist build failure maps to ZRUI_DRAWLIST_BUILD_ERROR (#61)", () => {
  const backend: RuntimeBackend = {
    start: () => Promise.resolve(),
    stop: () => Promise.resolve(),
    dispose: () => undefined,
    pollEvents: () => new Promise(() => undefined),
    postUserEvent: () => undefined,
    requestFrame: () => Promise.resolve(),
    getCaps: () => Promise.resolve(DEFAULT_TERMINAL_CAPS),
  };

  const badBuilder: DrawlistBuilderV1 = {
    clear(): void {},
    clearTo(): void {},
    fillRect(): void {},
    drawText(): void {},
    pushClip(): void {},
    popClip(): void {},
    addBlob(): number | null {
      return null;
    },
    addTextRunBlob(): number | null {
      return null;
    },
    drawTextRun(): void {},
    reset(): void {},
    build() {
      return { ok: false, error: { code: "ZRDL_TOO_LARGE", detail: "cap" } } as const;
    },
  };

  const renderer = new RawRenderer({ backend, builder: badBuilder });
  const res = renderer.submitFrame((g) => g.clear(), {
    enterRender: () => undefined,
    exitRender: () => undefined,
  });

  assert.equal(res.ok, false);
  if (!res.ok) assert.equal(res.code, "ZRUI_DRAWLIST_BUILD_ERROR");
});
