import type { BackendEventBatch, RuntimeBackend } from "../../backend.js";
import { DEFAULT_TERMINAL_CAPS, type TerminalCaps } from "../../terminalCaps.js";

type Deferred<T> = Readonly<{
  promise: Promise<T>;
  resolve: (v: T) => void;
  reject: (e: unknown) => void;
}>;

function deferred<T>(): Deferred<T> {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

export class StubBackend implements RuntimeBackend {
  startCalls = 0;
  stopCalls = 0;
  disposeCalls = 0;

  readonly requestedFrames: Uint8Array[] = [];
  readonly callLog: string[] = [];

  private readonly pollWaiters: Array<(b: BackendEventBatch) => void> = [];
  private readonly pollBuffered: BackendEventBatch[] = [];

  private readonly frameDeferreds: Array<Deferred<void>> = [];

  start(): Promise<void> {
    this.startCalls++;
    this.callLog.push("start");
    return Promise.resolve();
  }

  stop(): Promise<void> {
    this.stopCalls++;
    this.callLog.push("stop");
    return Promise.resolve();
  }

  dispose(): void {
    this.disposeCalls++;
    this.callLog.push("dispose");
  }

  requestFrame(drawlist: Uint8Array): Promise<void> {
    this.requestedFrames.push(drawlist);
    this.callLog.push("requestFrame");
    const d = deferred<void>();
    this.frameDeferreds.push(d);
    return d.promise;
  }

  resolveNextFrame(): void {
    const d = this.frameDeferreds.shift();
    if (!d) throw new Error("StubBackend: no in-flight frame to resolve");
    d.resolve(undefined);
  }

  rejectNextFrame(err: unknown): void {
    const d = this.frameDeferreds.shift();
    if (!d) throw new Error("StubBackend: no in-flight frame to reject");
    d.reject(err);
  }

  pollEvents(): Promise<BackendEventBatch> {
    const b = this.pollBuffered.shift();
    if (b) return Promise.resolve(b);
    return new Promise<BackendEventBatch>((resolve) => {
      this.pollWaiters.push(resolve);
    });
  }

  pushBatch(batch: BackendEventBatch): void {
    const w = this.pollWaiters.shift();
    if (w) {
      w(batch);
      return;
    }
    this.pollBuffered.push(batch);
  }

  postUserEvent(_tag: number, _payload: Uint8Array): void {
    // Not needed by these app runtime unit tests.
  }

  getCaps(): Promise<TerminalCaps> {
    return Promise.resolve(DEFAULT_TERMINAL_CAPS);
  }
}
