import { assert, describe, test } from "@rezi-ui/testkit";
import { deferred } from "../render/deferred.js";

describe("render/deferred", () => {
  test("resolves a deferred promise", async () => {
    const d = deferred<number>();
    d.resolve(42);
    assert.equal(await d.promise, 42);
  });

  test("rejects a deferred promise", async () => {
    const d = deferred<number>();
    const err = new Error("boom");
    d.reject(err);
    await assert.rejects(async () => d.promise, /boom/);
  });
});
