#!/usr/bin/env node
/**
 * check-unicode-sync.mjs
 *
 * Verifies that pinned Unicode tables used by:
 * - C engine (vendor/zireael + packages/native/vendor/zireael)
 * - TypeScript core (packages/core/src/layout/unicode)
 *
 * remain synchronized.
 *
 * Why: If these diverge, TS layout width/grapheme behavior will not match
 * C rendering, causing overflows/clipping bugs.
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

function sha256Hex(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function stripCarriageReturns(bytes) {
  let crCount = 0;
  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i] === 13) crCount++;
  }
  if (crCount === 0) return bytes;

  const out = new Uint8Array(bytes.length - crCount);
  let j = 0;
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    if (b === 13) continue;
    out[j++] = b;
  }
  return out;
}

function extractBlock(text, startMarker) {
  const start = text.indexOf(startMarker);
  if (start < 0) throw new Error(`missing marker: ${startMarker}`);
  const brace = text.indexOf("{", start);
  if (brace < 0) throw new Error(`missing '{' after marker: ${startMarker}`);
  const end = text.indexOf("};", brace);
  if (end < 0) throw new Error(`missing '};' terminator for marker: ${startMarker}`);
  return text.slice(brace + 1, end);
}

function parseGcbEnum(headerText) {
  const start = headerText.indexOf("typedef enum zr_gcb_class_t");
  if (start < 0) throw new Error("missing zr_gcb_class_t enum");
  const brace = headerText.indexOf("{", start);
  const end = headerText.indexOf("}", brace);
  if (brace < 0 || end < 0) throw new Error("malformed zr_gcb_class_t enum");

  const body = headerText.slice(brace + 1, end);
  const names = body
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.replace(/\s*=.*$/, "").trim())
    .filter((s) => s.startsWith("ZR_GCB_"));

  const map = new Map();
  for (let i = 0; i < names.length; i++) map.set(names[i], i);
  if (!map.has("ZR_GCB_OTHER")) throw new Error("expected ZR_GCB_OTHER in enum");
  return map;
}

function parseIncGcbRanges(incText, gcbEnum) {
  const block = extractBlock(incText, "static const zr_unicode_range8_t kGcbRanges[]");
  const out = [];
  const re =
    /\{\s*(0x[0-9A-Fa-f]+)u\s*,\s*(0x[0-9A-Fa-f]+)u\s*,\s*\(uint8_t\)(ZR_GCB_[A-Z_]+)\s*,/g;
  for (;;) {
    const m = re.exec(block);
    if (!m) break;
    const lo = Number.parseInt(m[1], 16);
    const hi = Number.parseInt(m[2], 16);
    const cls = m[3];
    const v = gcbEnum.get(cls);
    if (v === undefined) throw new Error(`unknown GCB enum value: ${cls}`);
    out.push(lo, hi, v);
  }
  if (out.length === 0) throw new Error("parsed 0 GCB ranges from inc");
  return out;
}

function parseIncPairRanges(incText, name) {
  const block = extractBlock(incText, `static const zr_unicode_range_t ${name}[]`);
  const out = [];
  const re = /\{\s*(0x[0-9A-Fa-f]+)u\s*,\s*(0x[0-9A-Fa-f]+)u\s*\}/g;
  for (;;) {
    const m = re.exec(block);
    if (!m) break;
    out.push(Number.parseInt(m[1], 16), Number.parseInt(m[2], 16));
  }
  if (out.length === 0) throw new Error(`parsed 0 ranges from inc for ${name}`);
  return out;
}

function parseTsUint32Array(tsText, exportName) {
  const marker = `export const ${exportName} = new Uint32Array([`;
  const start = tsText.indexOf(marker);
  if (start < 0) throw new Error(`missing export Uint32Array: ${exportName}`);
  const bodyStart = start + marker.length;
  const end = tsText.indexOf("]);", bodyStart);
  if (end < 0) throw new Error(`missing array terminator for export: ${exportName}`);
  const body = tsText.slice(bodyStart, end);
  const nums = body.match(/0x[0-9A-Fa-f]+|\d+/g) ?? [];
  if (nums.length === 0) throw new Error(`parsed 0 numbers from TS array: ${exportName}`);
  return nums.map((t) => (t.startsWith("0x") ? Number.parseInt(t, 16) : Number.parseInt(t, 10)));
}

function assertEqualArray(a, b, label) {
  if (a.length !== b.length) {
    throw new Error(`${label}: length mismatch (a=${a.length}, b=${b.length})`);
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      throw new Error(`${label}: mismatch at index ${i} (a=${a[i]}, b=${b[i]})`);
    }
  }
}

export function checkUnicodeSync(rootDir) {
  const root = rootDir ?? join(dirname(fileURLToPath(import.meta.url)), "..");

  const vendorIncPath = join(root, "vendor/zireael/src/unicode/zr_unicode_data_tables_15_1_0.inc");
  const nativeIncPath = join(
    root,
    "packages/native/vendor/zireael/src/unicode/zr_unicode_data_tables_15_1_0.inc",
  );
  const vendorHdrPath = join(root, "vendor/zireael/src/unicode/zr_unicode_data.h");
  const nativeHdrPath = join(root, "packages/native/vendor/zireael/src/unicode/zr_unicode_data.h");
  const tsPath = join(root, "packages/core/src/layout/unicode/tables_15_1_0.ts");

  const vendorIncExists = existsSync(vendorIncPath);
  const nativeIncExists = existsSync(nativeIncPath);
  if (!vendorIncExists && !nativeIncExists) {
    throw new Error(
      [
        "unicode tables file is missing in both expected locations:",
        `- ${vendorIncPath}`,
        `- ${nativeIncPath}`,
      ].join("\n"),
    );
  }

  let incBytes;
  let incSourcePath;
  if (vendorIncExists) {
    incBytes = stripCarriageReturns(readFileSync(vendorIncPath));
    incSourcePath = vendorIncPath;
  } else {
    incBytes = stripCarriageReturns(readFileSync(nativeIncPath));
    incSourcePath = nativeIncPath;
  }

  if (vendorIncExists && nativeIncExists) {
    const nativeIncBytes = stripCarriageReturns(readFileSync(nativeIncPath));
    const vendorIncSha = sha256Hex(incBytes);
    const nativeIncSha = sha256Hex(nativeIncBytes);
    if (vendorIncSha !== nativeIncSha) {
      throw new Error(
        [
          "unicode tables inc mismatch between vendor copies:",
          `- ${vendorIncPath} sha256=${vendorIncSha}`,
          `- ${nativeIncPath} sha256=${nativeIncSha}`,
        ].join("\n"),
      );
    }
  }

  let hdrPath;
  if (existsSync(vendorHdrPath)) {
    hdrPath = vendorHdrPath;
  } else if (existsSync(nativeHdrPath)) {
    hdrPath = nativeHdrPath;
  } else {
    throw new Error(
      [
        "unicode header file is missing in both expected locations:",
        `- ${vendorHdrPath}`,
        `- ${nativeHdrPath}`,
      ].join("\n"),
    );
  }

  const incText = new TextDecoder().decode(incBytes);
  const hdrText = new TextDecoder().decode(readFileSync(hdrPath));
  const tsText = new TextDecoder().decode(readFileSync(tsPath));

  const gcbEnum = parseGcbEnum(hdrText);

  const incGcb = parseIncGcbRanges(incText, gcbEnum);
  const incExtPict = parseIncPairRanges(incText, "kExtendedPictographicRanges");
  const incEmojiPres = parseIncPairRanges(incText, "kEmojiPresentationRanges");
  const incEawWide = parseIncPairRanges(incText, "kEawWideRanges");

  const tsGcb = parseTsUint32Array(tsText, "GCB_RANGES_15_1_0");
  const tsExtPict = parseTsUint32Array(tsText, "EXTENDED_PICTOGRAPHIC_RANGES_15_1_0");
  const tsEmojiPres = parseTsUint32Array(tsText, "EMOJI_PRESENTATION_RANGES_15_1_0");
  const tsEawWide = parseTsUint32Array(tsText, "EAW_WIDE_RANGES_15_1_0");

  assertEqualArray(tsGcb, incGcb, "GCB ranges");
  assertEqualArray(tsExtPict, incExtPict, "Extended pictographic ranges");
  assertEqualArray(tsEmojiPres, incEmojiPres, "Emoji presentation ranges");
  assertEqualArray(tsEawWide, incEawWide, "EAW wide ranges");

  return { success: true, incSourcePath };
}

const invokedPath = process.argv[1] ? realpathSync(process.argv[1]) : null;
const selfPath = realpathSync(fileURLToPath(import.meta.url));
if (invokedPath && invokedPath === selfPath) {
  try {
    checkUnicodeSync();
    process.stdout.write("check-unicode-sync: OK\n");
    process.exit(0);
  } catch (err) {
    process.stderr.write(`check-unicode-sync: FAIL\n${String(err?.stack ?? err)}\n`);
    process.exit(1);
  }
}
