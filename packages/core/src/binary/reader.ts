/**
 * packages/core/src/binary/reader.ts — Bounds-checked binary buffer reader.
 *
 * Why: Provides safe, deterministic reading of little-endian binary data with
 * automatic bounds validation. Every read operation validates available bytes
 * before access, preventing buffer overflows and ensuring parse failures are
 * caught early with precise offset reporting.
 *
 * Invariants:
 *   - All multi-byte reads use little-endian byte order
 *   - DataView is constructed with correct byteOffset to handle Uint8Array slices
 *   - Offset advances only after successful validation
 *   - ZrBinaryError thrown on any bounds/alignment violation
 *
 * @see docs/protocol/safety.md
 */

import { ZrBinaryError } from "./parseError.js";

/**
 * Bounds-checked binary reader with cursor tracking.
 *
 * Ownership: BinaryReader borrows the input buffer; caller retains ownership.
 * The buffer must remain valid and unmodified for the reader's lifetime.
 */
export class BinaryReader {
  private readonly bytes: Uint8Array;
  private readonly dv: DataView;
  private off = 0;

  constructor(bytes: Uint8Array) {
    this.bytes = bytes;
    this.dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  }

  get offset(): number {
    return this.off;
  }

  get byteLength(): number {
    return this.bytes.byteLength;
  }

  get remaining(): number {
    return this.byteLength - this.off;
  }

  /** Validate that offset is 4-byte aligned; throws ZR_MISALIGNED on violation. */
  ensureAligned4(offset: number = this.off): void {
    if ((offset & 3) !== 0) {
      throw new ZrBinaryError({
        code: "ZR_MISALIGNED",
        offset,
        detail: "offset must be 4-byte aligned",
      });
    }
  }

  /** Advance cursor by len bytes without reading; validates bounds first. */
  skip(len: number): void {
    if (!Number.isInteger(len) || len < 0) {
      throw new Error(`BinaryReader.skip: len must be a non-negative integer (got ${String(len)})`);
    }
    this.ensureAvailable(len);
    this.off += len;
  }

  /** Read unsigned 8-bit integer, advancing cursor by 1 byte. */
  readU8(): number {
    this.ensureAvailable(1);
    const v = this.dv.getUint8(this.off);
    this.off += 1;
    return v;
  }

  /** Read unsigned 32-bit integer (little-endian), advancing cursor by 4 bytes. */
  readU32(): number {
    this.ensureAvailable(4);
    const v = this.dv.getUint32(this.off, true);
    this.off += 4;
    return v;
  }

  /** Read signed 32-bit integer (little-endian), advancing cursor by 4 bytes. */
  readI32(): number {
    this.ensureAvailable(4);
    const v = this.dv.getInt32(this.off, true);
    this.off += 4;
    return v;
  }

  /**
   * Read len bytes as a subarray view, advancing cursor by len bytes.
   * The returned Uint8Array shares the underlying buffer with the reader.
   */
  readBytes(len: number): Uint8Array {
    if (!Number.isInteger(len) || len < 0) {
      throw new Error(
        `BinaryReader.readBytes: len must be a non-negative integer (got ${String(len)})`,
      );
    }
    this.ensureAvailable(len);
    const out = this.bytes.subarray(this.off, this.off + len);
    this.off += len;
    return out;
  }

  /**
   * Validate that n bytes are available from current cursor position.
   * Throws ZR_TRUNCATED if buffer would be exceeded.
   */
  private ensureAvailable(n: number): void {
    if (this.off + n > this.byteLength) {
      throw new ZrBinaryError({
        code: "ZR_TRUNCATED",
        offset: this.off,
        detail: `need ${n} byte(s) but only ${Math.max(0, this.byteLength - this.off)} remaining`,
      });
    }
  }
}
