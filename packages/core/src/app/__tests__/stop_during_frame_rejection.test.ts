import { assert, test } from "@rezi-ui/testkit";
import { createApp } from "../createApp.js";
import { flushMicrotasks } from "./helpers.js";
import { StubBackend } from "./stubBackend.js";

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

class StopBlockingBackend extends StubBackend {
  private stopDeferred: Deferred<void> | null = null;

  stop(): Promise<void> {
    this.stopCalls++;
    this.callLog.push("stop");
    if (!this.stopDeferred) this.stopDeferred = deferred<void>();
    return this.stopDeferred.promise;
  }

  resolveStop(): void {
    const d = this.stopDeferred;
    if (!d) throw new Error("StopBlockingBackend: stop() was not called");
    d.resolve(undefined);
  }
}

test("stop ignores requestFrame rejection during stop", async () => {
  const backend = new StopBlockingBackend();
  const app = createApp({ backend, initialState: 0 });
  app.draw((g) => g.clear());

  const fatals: unknown[] = [];
  app.onEvent((ev) => {
    if (ev.kind === "fatal") fatals.push(ev);
  });

  await app.start();
  await flushMicrotasks(5);

  assert.deepEqual(backend.callLog.slice(0, 2), ["start", "requestFrame"]);

  const stopPromise = app.stop();

  // Simulate backend.stop() causing the in-flight requestFrame() to reject.
  backend.rejectNextFrame(new Error("NodeBackend: stopped"));
  await flushMicrotasks(5);

  assert.equal(fatals.length, 0);
  assert.equal(backend.stopCalls, 1);

  backend.resolveStop();
  await stopPromise;

  // If the app faulted, start() would throw.
  await app.start();
  app.dispose();
});
