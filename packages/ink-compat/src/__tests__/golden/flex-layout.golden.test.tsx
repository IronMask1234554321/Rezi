import { assertBytesEqual, describe, readFixture, test } from "@rezi-ui/testkit";
import React from "react";
import { Box, Spacer, Text } from "../../index.js";
import { renderToLastFrameBytes } from "./harness.js";

async function load(rel: string): Promise<Uint8Array> {
  return readFixture(`zrdl-v1/ink-compat/${rel}`);
}

describe("golden: ink-compat flex layout", () => {
  test("flex_layout.bin", async () => {
    const expected = await load("flex_layout.bin");
    const actual = await renderToLastFrameBytes(
      <Box flexDirection="row" width={20} paddingX={1}>
        <Text>L</Text>
        <Spacer />
        <Text>R</Text>
      </Box>,
    );
    assertBytesEqual(actual, expected, "flex_layout.bin");
  });
});
