import { assertBytesEqual, describe, readFixture, test } from "@rezi-ui/testkit";
import React from "react";
import { Text } from "../../index.js";
import { renderToLastFrameBytes } from "./harness.js";

async function load(rel: string): Promise<Uint8Array> {
  return readFixture(`zrdl-v1/ink-compat/${rel}`);
}

describe("golden: ink-compat simple text", () => {
  test("simple_text.bin", async () => {
    const expected = await load("simple_text.bin");
    const actual = await renderToLastFrameBytes(<Text color="greenBright">Hello</Text>);
    assertBytesEqual(actual, expected, "simple_text.bin");
  });
});
