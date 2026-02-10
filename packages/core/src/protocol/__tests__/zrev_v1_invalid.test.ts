import { assert, describe, readFixture, test } from "@rezi-ui/testkit";
import { ZREV_MAGIC, ZR_EVENT_BATCH_VERSION_V1 } from "../../abi.js";
import { parseEventBatchV1 } from "../zrev_v1.js";

async function load(rel: string): Promise<Uint8Array> {
  return readFixture(`zrev-v1/invalid/${rel}`);
}

describe("parseEventBatchV1 (ZREV v1) - invalid fixtures", () => {
  const cases = [
    { file: "truncated_header.bin", code: "ZR_TRUNCATED", offset: 0 },
    { file: "truncated_record_header.bin", code: "ZR_TRUNCATED", offset: 24 },
    { file: "truncated_payload.bin", code: "ZR_INVALID_RECORD", offset: 24 },
    { file: "total_size_mismatch.bin", code: "ZR_SIZE_MISMATCH", offset: 24 },
    { file: "misaligned_record_size.bin", code: "ZR_MISALIGNED", offset: 24 },
    { file: "bad_magic.bin", code: "ZR_BAD_MAGIC", offset: 0 },
    { file: "bad_version.bin", code: "ZR_UNSUPPORTED_VERSION", offset: 4 },
  ] as const;

  for (const c of cases) {
    test(c.file, async () => {
      const bytes = await load(c.file);
      const res = parseEventBatchV1(bytes);
      assert.equal(res.ok, false);
      if (res.ok) return;
      assert.equal(res.error.code, c.code);
      assert.equal(res.error.offset, c.offset);
    });
  }

  test("cap: event_count > maxEvents", () => {
    const bytes = new Uint8Array(24);
    const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    dv.setUint32(0, ZREV_MAGIC, true);
    dv.setUint32(4, ZR_EVENT_BATCH_VERSION_V1, true);
    dv.setUint32(8, 24, true);
    dv.setUint32(12, 4097, true);
    dv.setUint32(16, 0, true);
    dv.setUint32(20, 0, true);

    const res = parseEventBatchV1(bytes);
    assert.equal(res.ok, false);
    if (res.ok) return;
    assert.equal(res.error.code, "ZR_LIMIT");
    assert.equal(res.error.offset, 12);
  });

  test("cap: paste.byte_len > maxPasteBytes", () => {
    // total_size = 24 + record(24)
    const bytes = new Uint8Array(48);
    const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    dv.setUint32(0, ZREV_MAGIC, true);
    dv.setUint32(4, ZR_EVENT_BATCH_VERSION_V1, true);
    dv.setUint32(8, 48, true);
    dv.setUint32(12, 1, true);
    dv.setUint32(16, 0, true);
    dv.setUint32(20, 0, true);

    // record header @ 24
    dv.setUint32(24, 3, true); // PASTE
    dv.setUint32(28, 24, true); // size (header + 8)
    dv.setUint32(32, 1, true);
    dv.setUint32(36, 0, true);
    // payload @ 40
    dv.setUint32(40, 256 * 1024 + 1, true);
    dv.setUint32(44, 0, true);

    const res = parseEventBatchV1(bytes);
    assert.equal(res.ok, false);
    if (res.ok) return;
    assert.equal(res.error.code, "ZR_LIMIT");
    assert.equal(res.error.offset, 40);
  });

  test("cap: user.byte_len > maxUserPayloadBytes", () => {
    // total_size = 24 + record(32)
    const bytes = new Uint8Array(56);
    const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    dv.setUint32(0, ZREV_MAGIC, true);
    dv.setUint32(4, ZR_EVENT_BATCH_VERSION_V1, true);
    dv.setUint32(8, 56, true);
    dv.setUint32(12, 1, true);
    dv.setUint32(16, 0, true);
    dv.setUint32(20, 0, true);

    // record header @ 24
    dv.setUint32(24, 7, true); // USER
    dv.setUint32(28, 32, true); // size (header + 16)
    dv.setUint32(32, 1, true);
    dv.setUint32(36, 0, true);
    // payload @ 40
    dv.setUint32(40, 1, true); // tag
    dv.setUint32(44, 256 * 1024 + 1, true);
    dv.setUint32(48, 0, true);
    dv.setUint32(52, 0, true);

    const res = parseEventBatchV1(bytes);
    assert.equal(res.ok, false);
    if (res.ok) return;
    assert.equal(res.error.code, "ZR_LIMIT");
    assert.equal(res.error.offset, 44);
  });

  test("MOUSE: invalid kind fails deterministically", () => {
    // total_size = 24 + record(48)
    const bytes = new Uint8Array(72);
    const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    dv.setUint32(0, ZREV_MAGIC, true);
    dv.setUint32(4, ZR_EVENT_BATCH_VERSION_V1, true);
    dv.setUint32(8, 72, true);
    dv.setUint32(12, 1, true);
    dv.setUint32(16, 0, true);
    dv.setUint32(20, 0, true);

    // record header @ 24
    dv.setUint32(24, 4, true); // MOUSE
    dv.setUint32(28, 48, true); // size (header + 32)
    dv.setUint32(32, 1, true);
    dv.setUint32(36, 0, true);
    // payload @ 40
    dv.setInt32(40, 0, true); // x
    dv.setInt32(44, 0, true); // y
    dv.setUint32(48, 99, true); // invalid kind
    dv.setUint32(52, 0, true); // mods
    dv.setUint32(56, 0, true); // buttons
    dv.setInt32(60, 0, true); // wheelX
    dv.setInt32(64, 0, true); // wheelY
    dv.setUint32(68, 0, true); // reserved0

    const res = parseEventBatchV1(bytes);
    assert.equal(res.ok, false);
    if (res.ok) return;
    assert.equal(res.error.code, "ZR_INVALID_RECORD");
    assert.equal(res.error.offset, 24);
  });
});
