import { assertBytesEqual, hexdump } from "../golden.js";
import { assert, test } from "../nodeTest.js";

test("hexdump uses stable formatting", () => {
  const bytes = new Uint8Array([
    0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x41, 0x7e, 0x7f, 0xff,
  ]);
  const out = hexdump(bytes);
  assert.equal(
    out,
    "00000000  00 01 02 03 04 05 06 07  08 09 0a 0b 41 7e 7f ff  |............A~..|",
  );
});

test("assertBytesEqual reports first mismatch with window", () => {
  const actual = new Uint8Array([1, 2, 3, 4, 5, 6]);
  const expected = new Uint8Array([1, 2, 9, 4, 5, 6]);

  assert.throws(
    () => assertBytesEqual(actual, expected, "demo"),
    (err) => {
      assert.ok(err instanceof Error);
      assert.ok(err.message.includes("assertBytesEqual (demo): mismatch at offset 2 (0x00000002)"));
      assert.ok(err.message.includes("expected 0x09 but got 0x03"));
      assert.ok(err.message.includes("expected (window):"));
      assert.ok(err.message.includes("actual (window):"));
      return true;
    },
  );
});
