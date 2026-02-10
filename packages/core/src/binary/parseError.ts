/**
 * packages/core/src/binary/parseError.ts — Binary parsing error types and classes.
 *
 * Why: Provides structured, deterministic error reporting for binary buffer
 * operations. All binary read/write failures must produce ZrBinaryError with
 * explicit code, offset, and detail to enable debugging and error recovery.
 *
 * Error codes:
 *   - ZR_TRUNCATED: attempted read beyond buffer bounds
 *   - ZR_MISALIGNED: offset violates 4-byte alignment requirement
 *   - ZR_LIMIT: operation exceeds configured capacity/limit
 *
 * @see docs/protocol/safety.md
 */

export type ZrBinaryErrorCode = "ZR_TRUNCATED" | "ZR_MISALIGNED" | "ZR_LIMIT";

/**
 * Initialization data for ZrBinaryError.
 * Required fields ensure all binary errors have complete diagnostic context.
 */
export type ZrBinaryErrorInit = Readonly<{
  code: ZrBinaryErrorCode;
  offset: number;
  detail: string;
}>;

/**
 * Structured error for binary buffer operations.
 *
 * Thrown by BinaryReader/BinaryWriter when buffer constraints are violated.
 * Includes byte offset for precise error localization in binary debugging.
 */
export class ZrBinaryError extends Error {
  readonly code: ZrBinaryErrorCode;
  readonly offset: number;
  readonly detail: string;

  constructor(init: ZrBinaryErrorInit) {
    super(`${init.code} at ${init.offset}: ${init.detail}`);
    this.name = "ZrBinaryError";
    this.code = init.code;
    this.offset = init.offset;
    this.detail = init.detail;
  }
}
