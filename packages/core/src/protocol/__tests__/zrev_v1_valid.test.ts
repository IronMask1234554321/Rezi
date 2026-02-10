import { assert, describe, readFixture, test } from "@rezi-ui/testkit";
import { parseEventBatchV1 } from "../zrev_v1.js";

async function load(rel: string): Promise<Uint8Array> {
  return readFixture(`zrev-v1/valid/${rel}`);
}

describe("parseEventBatchV1 (ZREV v1) - valid fixtures", () => {
  test("key.bin", async () => {
    const bytes = await load("key.bin");
    const res = parseEventBatchV1(bytes);
    assert.equal(res.ok, true);
    if (!res.ok) return;

    assert.equal(res.value.flags, 0);
    assert.equal(res.value.events.length, 1);
    assert.deepEqual(res.value.events[0], {
      kind: "key",
      timeMs: 1000,
      key: 23,
      mods: 3,
      action: "down",
    });
  });

  test("text.bin", async () => {
    const bytes = await load("text.bin");
    const res = parseEventBatchV1(bytes);
    assert.equal(res.ok, true);
    if (!res.ok) return;

    assert.equal(res.value.flags, 0);
    assert.equal(res.value.events.length, 1);
    assert.deepEqual(res.value.events[0], {
      kind: "text",
      timeMs: 2000,
      codepoint: 0x41,
    });
  });

  test("paste.bin", async () => {
    const bytes = await load("paste.bin");
    const res = parseEventBatchV1(bytes);
    assert.equal(res.ok, true);
    if (!res.ok) return;

    assert.equal(res.value.flags, 0);
    assert.equal(res.value.events.length, 1);

    const ev = res.value.events[0];
    assert.ok(ev);
    if (!ev) return;
    assert.equal(ev.kind, "paste");
    if (ev.kind !== "paste") return;

    assert.equal(ev.timeMs, 3000);
    assert.equal(ev.bytes.buffer, bytes.buffer);
    assert.deepEqual(Array.from(ev.bytes), [0x68, 0x65, 0x6c, 0x6c, 0x6f]); // "hello"
  });

  test("mouse.bin", async () => {
    const bytes = await load("mouse.bin");
    const res = parseEventBatchV1(bytes);
    assert.equal(res.ok, true);
    if (!res.ok) return;

    assert.equal(res.value.flags, 0);
    assert.equal(res.value.events.length, 1);
    assert.deepEqual(res.value.events[0], {
      kind: "mouse",
      timeMs: 4000,
      x: 10,
      y: 5,
      mouseKind: 1,
      mods: 0,
      buttons: 1,
      wheelX: 0,
      wheelY: -1,
    });
  });

  test("resize.bin", async () => {
    const bytes = await load("resize.bin");
    const res = parseEventBatchV1(bytes);
    assert.equal(res.ok, true);
    if (!res.ok) return;

    assert.equal(res.value.flags, 0);
    assert.equal(res.value.events.length, 1);
    assert.deepEqual(res.value.events[0], {
      kind: "resize",
      timeMs: 5000,
      cols: 80,
      rows: 24,
    });
  });

  test("tick.bin", async () => {
    const bytes = await load("tick.bin");
    const res = parseEventBatchV1(bytes);
    assert.equal(res.ok, true);
    if (!res.ok) return;

    assert.equal(res.value.flags, 0);
    assert.equal(res.value.events.length, 1);
    assert.deepEqual(res.value.events[0], {
      kind: "tick",
      timeMs: 6000,
      dtMs: 16,
    });
  });

  test("user.bin", async () => {
    const bytes = await load("user.bin");
    const res = parseEventBatchV1(bytes);
    assert.equal(res.ok, true);
    if (!res.ok) return;

    assert.equal(res.value.flags, 0);
    assert.equal(res.value.events.length, 1);

    const ev = res.value.events[0];
    assert.ok(ev);
    if (!ev) return;
    assert.equal(ev.kind, "user");
    if (ev.kind !== "user") return;

    assert.equal(ev.timeMs, 7000);
    assert.equal(ev.tag, 42);
    assert.equal(ev.payload.buffer, bytes.buffer);
    assert.deepEqual(Array.from(ev.payload), [1, 2, 3]);
  });
});
