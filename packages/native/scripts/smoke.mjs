import { Worker } from "node:worker_threads";
import { engineCreate, engineDestroy, enginePresent } from "../index.js";

const ZR_ERR_INVALID_ARGUMENT = -1;
const ZR_ERR_PLATFORM = -6;

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

// Unknown / stale id behavior (result-returning fns).
assert(
  enginePresent(0) === ZR_ERR_INVALID_ARGUMENT,
  "enginePresent(0) must return ZR_ERR_INVALID_ARGUMENT",
);
assert(
  enginePresent(0x7fff_fffe) === ZR_ERR_INVALID_ARGUMENT,
  "enginePresent(unknown) must return ZR_ERR_INVALID_ARGUMENT",
);

const engineId = engineCreate({});

assert(typeof engineId === "number", "engineCreate must return a number");
if (engineId === ZR_ERR_PLATFORM && !(process.stdout.isTTY && process.stdin.isTTY)) {
  process.stdout.write("native-smoke: SKIP engineCreate() (no TTY / platform init unavailable)\n");
  process.exit(0);
}
assert(engineId > 0, `engineCreate must return a non-zero engineId, got: ${engineId}`);

const worker = new Worker(new URL("./smoke-worker.mjs", import.meta.url), {
  workerData: { engineId },
  type: "module",
});

const alive = await new Promise((resolve, reject) => {
  const onExit = (code) => reject(new Error(`worker exited with ${code}`));
  const onError = (err) => reject(err);
  const onMessage = (msg) => {
    worker.off("exit", onExit);
    worker.off("error", onError);
    resolve(msg);
  };
  worker.once("exit", onExit);
  worker.once("error", onError);
  worker.once("message", onMessage);
});

assert(alive.phase === "alive", "worker must send alive phase");
assert(
  alive.present === ZR_ERR_INVALID_ARGUMENT,
  `wrong-thread enginePresent must return ZR_ERR_INVALID_ARGUMENT, got: ${alive.present}`,
);
assert(
  alive.postUserEvent === 0,
  `enginePostUserEvent must succeed cross-thread while alive (ZR_OK), got: ${alive.postUserEvent}`,
);

engineDestroy(engineId);
engineDestroy(engineId); // idempotent

worker.postMessage({ type: "afterDestroy" });

const destroyed = await new Promise((resolve, reject) => {
  const onExit = (code) => reject(new Error(`worker exited with ${code}`));
  const onError = (err) => reject(err);
  const onMessage = (msg) => {
    worker.off("exit", onExit);
    worker.off("error", onError);
    resolve(msg);
  };
  worker.once("exit", onExit);
  worker.once("error", onError);
  worker.once("message", onMessage);
});

assert(destroyed.phase === "destroyed", "worker must send destroyed phase");
assert(
  destroyed.postUserEvent === ZR_ERR_INVALID_ARGUMENT,
  `postUserEvent after destroy must return ZR_ERR_INVALID_ARGUMENT, got: ${destroyed.postUserEvent}`,
);

await worker.terminate();
