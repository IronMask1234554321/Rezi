export type InkCompatErrorCode =
  | "INK_COMPAT_UNSUPPORTED"
  | "INK_COMPAT_INVALID_PROPS"
  | "INK_COMPAT_INTERNAL";

export class InkCompatError extends Error {
  readonly code: InkCompatErrorCode;

  constructor(code: InkCompatErrorCode, message: string, opts?: Readonly<{ cause?: unknown }>) {
    super(message, opts?.cause === undefined ? undefined : { cause: opts.cause });
    this.name = "InkCompatError";
    this.code = code;
  }
}
