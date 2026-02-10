import { assertBytesEqual, describe, readFixture, test } from "@rezi-ui/testkit";
import React from "react";
import { Box, Text } from "../../index.js";
import { renderToLastFrameBytes } from "./harness.js";

async function load(rel: string): Promise<Uint8Array> {
  return readFixture(`zrdl-v1/ink-compat/${rel}`);
}

describe("golden: ink-compat box layout", () => {
  test("box_layout.bin", async () => {
    const expected = await load("box_layout.bin");
    const actual = await renderToLastFrameBytes(
      <Box flexDirection="column" padding={1} borderStyle="single">
        <Text>A</Text>
        <Text>B</Text>
      </Box>,
    );
    assertBytesEqual(actual, expected, "box_layout.bin");
  });
});
