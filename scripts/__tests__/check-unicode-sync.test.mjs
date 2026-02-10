/**
 * Tests for check-unicode-sync.mjs
 */

import { strict as assert } from "node:assert";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, test } from "node:test";
import { checkUnicodeSync } from "../check-unicode-sync.mjs";

function writeUtf8(path, text) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text, "utf8");
}

function makeFixtureRoot() {
  return mkdtempSync(join(tmpdir(), "rezi-unicode-sync-"));
}

function writeCoreTsTables(root) {
  writeUtf8(
    join(root, "packages/core/src/layout/unicode/tables_15_1_0.ts"),
    [
      "export const GCB_RANGES_15_1_0 = new Uint32Array([0x0000, 0x0000, 0]);",
      "export const EXTENDED_PICTOGRAPHIC_RANGES_15_1_0 = new Uint32Array([0x0000, 0x0000]);",
      "export const EMOJI_PRESENTATION_RANGES_15_1_0 = new Uint32Array([0x0000, 0x0000]);",
      "export const EAW_WIDE_RANGES_15_1_0 = new Uint32Array([0x0000, 0x0000]);",
      "",
    ].join("\n"),
  );
}

function writeUnicodeHeader(root, baseDir) {
  writeUtf8(
    join(root, baseDir, "src/unicode/zr_unicode_data.h"),
    ["typedef enum zr_gcb_class_t {", "  ZR_GCB_OTHER = 0,", "} zr_gcb_class_t;", ""].join("\n"),
  );
}

function writeUnicodeInc(root, baseDir, eol) {
  const joinEol = (lines) => lines.join(eol) + eol;
  writeUtf8(
    join(root, baseDir, "src/unicode/zr_unicode_data_tables_15_1_0.inc"),
    joinEol([
      "static const zr_unicode_range8_t kGcbRanges[] = {",
      "  {0x0000u, 0x0000u, (uint8_t)ZR_GCB_OTHER, 0u},",
      "};",
      "static const zr_unicode_range_t kExtendedPictographicRanges[] = {",
      "  {0x0000u, 0x0000u},",
      "};",
      "static const zr_unicode_range_t kEmojiPresentationRanges[] = {",
      "  {0x0000u, 0x0000u},",
      "};",
      "static const zr_unicode_range_t kEawWideRanges[] = {",
      "  {0x0000u, 0x0000u},",
      "};",
    ]),
  );
}

describe("check-unicode-sync", () => {
  test("passes in repo state", () => {
    assert.equal(checkUnicodeSync().success, true);
  });

  test("passes when git submodule copy is absent", () => {
    const root = makeFixtureRoot();
    try {
      writeCoreTsTables(root);
      writeUnicodeHeader(root, "packages/native/vendor/zireael");
      writeUnicodeInc(root, "packages/native/vendor/zireael", "\n");

      assert.equal(checkUnicodeSync(root).success, true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("normalizes CRLF differences across vendor copies", () => {
    const root = makeFixtureRoot();
    try {
      writeCoreTsTables(root);
      writeUnicodeHeader(root, "vendor/zireael");
      writeUnicodeHeader(root, "packages/native/vendor/zireael");
      writeUnicodeInc(root, "vendor/zireael", "\r\n");
      writeUnicodeInc(root, "packages/native/vendor/zireael", "\n");

      assert.equal(checkUnicodeSync(root).success, true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
