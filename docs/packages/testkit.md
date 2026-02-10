# `@rezi-ui/testkit`

Test utilities and fixtures for Rezi applications and package-level tests.

## What it provides

- **Fixtures** for protocol and drawlist tests (golden byte blobs)
- **Golden helpers** (`assertBytesEqual`, `hexdump`) for stable diffs
- **Deterministic RNG** helpers (`createRng`) for fuzz-lite tests
- Convenience re-exports of Node’s `node:test` and `node:assert` APIs (Node-only)

## Typical usage

```ts
import { assert, describe, readFixture, test } from "@rezi-ui/testkit";

describe("zrev parser", () => {
  test("accepts valid v1 fixture", async () => {
    const bytes = await readFixture("zrev-v1/valid/key.bin");
    assert.ok(bytes.byteLength > 0);
  });
});
```

If you are writing tests outside this repo, prefer installing a released version that matches your `@rezi-ui/core` version.
