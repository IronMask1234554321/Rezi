import { AssertionError } from "node:assert";

export type HexdumpOptions = Readonly<{
  startOffset?: number;
  bytesPerLine?: number;
}>;

function toHex2(b: number): string {
  return b.toString(16).padStart(2, "0");
}

function toHex8(n: number): string {
  return (n >>> 0).toString(16).padStart(8, "0");
}

function toAscii(b: number): string {
  return b >= 0x20 && b <= 0x7e ? String.fromCharCode(b) : ".";
}

export function hexdump(bytes: Uint8Array, opts: HexdumpOptions = {}): string {
  const startOffset = opts.startOffset ?? 0;
  const bytesPerLine = opts.bytesPerLine ?? 16;

  if (!Number.isInteger(bytesPerLine) || bytesPerLine <= 0) {
    throw new Error(
      `hexdump: bytesPerLine must be a positive integer (got ${String(bytesPerLine)})`,
    );
  }
  if (!Number.isInteger(startOffset) || startOffset < 0) {
    throw new Error(
      `hexdump: startOffset must be a non-negative integer (got ${String(startOffset)})`,
    );
  }

  /** @type {string[]} */
  const lines = [];

  for (let i = 0; i < bytes.length; i += bytesPerLine) {
    const lineBytes = bytes.subarray(i, Math.min(bytes.length, i + bytesPerLine));
    const off = startOffset + i;

    let hexCol = "";
    let asciiCol = "";

    for (let j = 0; j < bytesPerLine; j++) {
      const hasByte = j < lineBytes.length;
      const b = hasByte ? (lineBytes[j] ?? 0) : 0;

      if (j > 0) hexCol += j === 8 ? "  " : " ";
      hexCol += hasByte ? toHex2(b) : "  ";

      asciiCol += hasByte ? toAscii(b) : " ";
    }

    lines.push(`${toHex8(off)}  ${hexCol}  |${asciiCol}|`);
  }

  return lines.join("\n");
}

export function assertBytesEqual(actual: Uint8Array, expected: Uint8Array, label?: string): void {
  const minLen = Math.min(actual.length, expected.length);

  let firstDiff = -1;
  for (let i = 0; i < minLen; i++) {
    if (actual[i] !== expected[i]) {
      firstDiff = i;
      break;
    }
  }
  if (firstDiff === -1 && actual.length !== expected.length) {
    firstDiff = minLen;
  }

  if (firstDiff === -1) return;

  const ctx = 16;
  const start = Math.max(0, firstDiff - ctx);
  const end = Math.min(Math.max(actual.length, expected.length), firstDiff + ctx + 1);

  const actualSlice = actual.subarray(start, Math.min(actual.length, end));
  const expectedSlice = expected.subarray(start, Math.min(expected.length, end));

  const a = actual[firstDiff];
  const e = expected[firstDiff];

  const aHex = a === undefined ? "EOF" : `0x${toHex2(a)}`;
  const eHex = e === undefined ? "EOF" : `0x${toHex2(e)}`;

  const name = label ? ` (${label})` : "";
  const msg = [
    `assertBytesEqual${name}: mismatch at offset ${firstDiff} (0x${toHex8(firstDiff)})`,
    `expected ${eHex} but got ${aHex}`,
    "",
    "expected (window):",
    hexdump(expectedSlice, { startOffset: start }),
    "",
    "actual (window):",
    hexdump(actualSlice, { startOffset: start }),
  ].join("\n");

  throw new AssertionError({ message: msg });
}
