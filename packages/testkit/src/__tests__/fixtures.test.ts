import { readFixture } from "../fixtures.js";
import { assert, test } from "../nodeTest.js";

test("readFixture loads bytes from packages/testkit/fixtures", async () => {
  const bytes = await readFixture("__selftest__/hello.bin");
  assert.deepEqual(Array.from(bytes), Array.from(new TextEncoder().encode("SELFTEST\n")));
});
