import { assert, createRng, test } from "@rezi-ui/testkit";
import { parseEventBatchV1 } from "../zrev_v1.js";

test("parseEventBatchV1 fuzz-lite (seeded, bounded): never throws", () => {
  const rng = createRng(0x5a52_4556); // 'ZREV'
  const maxLen = 4096;
  const iters = 10_000;

  function check(bytes: Uint8Array): void {
    let res: ReturnType<typeof parseEventBatchV1>;
    try {
      res = parseEventBatchV1(bytes);
    } catch (err: unknown) {
      assert.fail(`parseEventBatchV1 threw: ${String(err)}`);
      return;
    }

    assert.equal(typeof res.ok, "boolean");
    if (res.ok) {
      assert.equal(typeof res.value.flags, "number");
      assert.ok(Array.isArray(res.value.events));
    } else {
      assert.equal(typeof res.error.code, "string");
      assert.equal(typeof res.error.offset, "number");
      assert.equal(typeof res.error.detail, "string");
    }
  }

  for (let len = 0; len <= 64; len++) {
    check(rng.bytes(len));
  }

  for (let i = 0; i < iters; i++) {
    const len = rng.u32() % (maxLen + 1);
    check(rng.bytes(len));
  }
});
