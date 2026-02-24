import assert from "node:assert/strict";
import test from "node:test";
import { computeNextIdleDelay, computeTickTiming } from "../worker/tickTiming.js";

test("computeTickTiming keeps 60fps polling interval above 1ms and bounded", () => {
  const timing = computeTickTiming(60);
  assert.equal(timing.tickIntervalMs, 4);
  assert.ok(
    timing.maxIdleDelayMs >= 16,
    `maxIdleDelayMs should be >= 16, got ${timing.maxIdleDelayMs}`,
  );
});

test("computeTickTiming keeps high-fps active polling low-latency", () => {
  const timing = computeTickTiming(1000);
  assert.equal(timing.tickIntervalMs, 1);
  assert.ok(
    timing.maxIdleDelayMs >= 16,
    `maxIdleDelayMs should be >= 16, got ${timing.maxIdleDelayMs}`,
  );
});

test("computeNextIdleDelay with zero delay starts at base interval", () => {
  const timing = computeTickTiming(60);
  const delay = computeNextIdleDelay(0, timing.tickIntervalMs, timing.maxIdleDelayMs);
  assert.equal(delay, timing.tickIntervalMs);
});

test("computeNextIdleDelay backs off beyond base interval when idle", () => {
  const timing = computeTickTiming(60);
  let delay = timing.tickIntervalMs;
  for (let i = 0; i < 4; i++) {
    delay = computeNextIdleDelay(delay, timing.tickIntervalMs, timing.maxIdleDelayMs);
  }
  assert.ok(delay > timing.tickIntervalMs, `delay should increase above base; got ${delay}`);
  assert.ok(delay <= timing.maxIdleDelayMs, `delay should be <= maxIdleDelayMs; got ${delay}`);
});
