import { Writable } from "node:stream";

export type BlessedMeasuringOutput = Writable &
  Readonly<{
    isTTY: true;
    columns: number;
    rows: number;
    fd: number;
    writeCount: number;
    totalBytes: number;
    waitForWrite: () => Promise<void>;
    reset: () => void;
  }>;

export class BlessedTtyMeasuringStream extends Writable implements BlessedMeasuringOutput {
  writeCount = 0;
  totalBytes = 0;

  columns = process.stdout.columns ?? 120;
  rows = process.stdout.rows ?? 40;
  isTTY = true as const;
  fd = (process.stdout as unknown as { fd?: number }).fd ?? 1;

  private readonly writeResolvers: Array<() => void> = [];

  override _write(
    chunk: Buffer | string,
    encoding: BufferEncoding,
    callback: (error?: Error | null) => void,
  ): void {
    this.writeCount++;
    this.totalBytes +=
      typeof chunk === "string" ? Buffer.byteLength(chunk, encoding) : chunk.byteLength;

    const done = (err?: Error | null) => {
      const r = this.writeResolvers.shift();
      if (r) r();
      callback(err ?? null);
    };

    try {
      const out = process.stdout as unknown as NodeJS.WriteStream;
      if (typeof chunk === "string") out.write(chunk, encoding, done);
      else out.write(chunk, done);
    } catch (err) {
      done(err instanceof Error ? err : new Error(String(err)));
    }
  }

  waitForWrite(): Promise<void> {
    return new Promise<void>((resolve) => this.writeResolvers.push(resolve));
  }

  reset(): void {
    this.writeCount = 0;
    this.totalBytes = 0;
    this.writeResolvers.length = 0;
  }
}

export function createBlessedOutput(): BlessedMeasuringOutput {
  if (process.stdout.isTTY !== true) {
    throw new Error("blessed benchmarks require a TTY stdout (run with --io pty)");
  }
  return new BlessedTtyMeasuringStream();
}
