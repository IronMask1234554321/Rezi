import { assert, describe, test } from "@rezi-ui/testkit";
import { ZrBinaryError } from "../parseError.js";
import { BinaryReader } from "../reader.js";

describe("BinaryReader", () => {
  test("reads u32 at exact boundary; next read is truncated", () => {
    const r = new BinaryReader(new Uint8Array([1, 2, 3, 4]));
    assert.equal(r.readU32(), 0x04030201);
    assert.equal(r.remaining, 0);
    assert.throws(
      () => r.readU8(),
      (err: unknown) => {
        assert.ok(err instanceof ZrBinaryError);
        assert.equal(err.code, "ZR_TRUNCATED");
        assert.equal(err.offset, 4);
        assert.equal(err.message, "ZR_TRUNCATED at 4: need 1 byte(s) but only 0 remaining");
        return true;
      },
    );
  });

  test("constructs DataView with byteOffset/byteLength (view byteOffset != 0)", () => {
    const backing = new Uint8Array([0xaa, 1, 2, 3, 4, 0xbb]);
    const view = backing.subarray(1, 5); // [1,2,3,4], byteOffset != 0
    const r = new BinaryReader(view);
    assert.equal(r.readU32(), 0x04030201);
  });

  test("ensureAligned4 fails deterministically", () => {
    const r = new BinaryReader(new Uint8Array([0, 0, 0, 0, 0]));
    r.skip(1);
    assert.throws(
      () => r.ensureAligned4(),
      (err: unknown) => {
        assert.ok(err instanceof ZrBinaryError);
        assert.equal(err.code, "ZR_MISALIGNED");
        assert.equal(err.offset, 1);
        assert.equal(err.message, "ZR_MISALIGNED at 1: offset must be 4-byte aligned");
        return true;
      },
    );
  });
});
