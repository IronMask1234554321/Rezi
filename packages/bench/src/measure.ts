/**
 * Measurement utilities: timing statistics, memory & CPU snapshots, formatting.
 */

import type { BenchMetrics, CpuUsage, MemorySnapshot, TimingStats } from "./types.js";

// ── Statistics ──────────────────────────────────────────────────────

export function computeStats(samples: readonly number[]): TimingStats {
  if (samples.length === 0) {
    return { mean: 0, median: 0, p95: 0, p99: 0, min: 0, max: 0, stddev: 0, cv: 0 };
  }
  const sorted = [...samples].sort((a, b) => a - b);
  const n = sorted.length;
  const valueAt = (index: number) => sorted[index] ?? 0;
  const sum = sorted.reduce((a, b) => a + b, 0);
  const mean = sum / n;

  const mid = Math.floor(n / 2);
  const median = n % 2 === 0 ? (valueAt(mid - 1) + valueAt(mid)) / 2 : valueAt(mid);

  const p95 = valueAt(Math.min(Math.ceil(n * 0.95) - 1, n - 1));
  const p99 = valueAt(Math.min(Math.ceil(n * 0.99) - 1, n - 1));
  const min = valueAt(0);
  const max = valueAt(n - 1);

  const variance = sorted.reduce((acc, v) => acc + (v - mean) ** 2, 0) / n;
  const stddev = Math.sqrt(variance);
  const cv = mean > 0 ? stddev / mean : 0;

  return { mean, median, p95, p99, min, max, stddev, cv };
}

// ── Snapshots ───────────────────────────────────────────────────────

export function takeMemory(): MemorySnapshot {
  const m = process.memoryUsage();
  return {
    rssKb: Math.round(m.rss / 1024),
    heapUsedKb: Math.round(m.heapUsed / 1024),
    heapTotalKb: Math.round(m.heapTotal / 1024),
    externalKb: Math.round(m.external / 1024),
    arrayBuffersKb: Math.round(m.arrayBuffers / 1024),
  };
}

export function takeCpu(): CpuUsage {
  const c = process.cpuUsage();
  return { userMs: c.user / 1000, systemMs: c.system / 1000 };
}

export function diffCpu(before: CpuUsage, after: CpuUsage): CpuUsage {
  return {
    userMs: after.userMs - before.userMs,
    systemMs: after.systemMs - before.systemMs,
  };
}

export function peakMemory(a: MemorySnapshot, b: MemorySnapshot): MemorySnapshot {
  return {
    rssKb: Math.max(a.rssKb, b.rssKb),
    heapUsedKb: Math.max(a.heapUsedKb, b.heapUsedKb),
    heapTotalKb: Math.max(a.heapTotalKb, b.heapTotalKb),
    externalKb: Math.max(a.externalKb, b.externalKb),
    arrayBuffersKb: Math.max(a.arrayBuffersKb, b.arrayBuffersKb),
  };
}

// ── GC ──────────────────────────────────────────────────────────────

export function tryGc(): void {
  if (typeof globalThis.gc === "function") {
    globalThis.gc();
  }
}

// ── Metrics Builder ─────────────────────────────────────────────────

/**
 * Run a synchronous benchmark loop and collect all metrics.
 *
 * @param fn - The function to benchmark. Called with iteration index.
 * @param warmup - Number of warmup iterations (discarded).
 * @param iterations - Number of measured iterations.
 */
export function benchSync(
  fn: (i: number) => void,
  warmup: number,
  iterations: number,
): BenchMetrics {
  // Warmup
  for (let i = 0; i < warmup; i++) fn(i);

  tryGc();
  const memBefore = takeMemory();
  const cpuBefore = takeCpu();
  let memPeak = memBefore;

  const samples: number[] = [];
  const t0 = performance.now();

  for (let i = 0; i < iterations; i++) {
    const ts = performance.now();
    fn(i);
    samples.push(performance.now() - ts);

    // Sample memory every 100 iterations
    if (i % 100 === 99) {
      memPeak = peakMemory(memPeak, takeMemory());
    }
  }

  const totalWallMs = performance.now() - t0;
  const cpuAfter = takeCpu();
  const memAfter = takeMemory();
  memPeak = peakMemory(memPeak, memAfter);

  return {
    timing: computeStats(samples),
    memBefore,
    memAfter,
    memPeak,
    cpu: diffCpu(cpuBefore, cpuAfter),
    iterations,
    totalWallMs,
    opsPerSec: iterations / (totalWallMs / 1000),
    framesProduced: iterations,
    bytesProduced: 0,
  };
}

/**
 * Run an async benchmark loop and collect all metrics.
 *
 * @param fn - Async function to benchmark. Must resolve when one iteration is complete.
 * @param warmup - Number of warmup iterations.
 * @param iterations - Number of measured iterations.
 */
export async function benchAsync(
  fn: (i: number) => Promise<void>,
  warmup: number,
  iterations: number,
): Promise<BenchMetrics> {
  // Warmup
  for (let i = 0; i < warmup; i++) await fn(i);

  tryGc();
  const memBefore = takeMemory();
  const cpuBefore = takeCpu();
  let memPeak = memBefore;

  const samples: number[] = [];
  const t0 = performance.now();

  for (let i = 0; i < iterations; i++) {
    const ts = performance.now();
    await fn(i);
    samples.push(performance.now() - ts);

    if (i % 100 === 99) {
      memPeak = peakMemory(memPeak, takeMemory());
    }
  }

  const totalWallMs = performance.now() - t0;
  const cpuAfter = takeCpu();
  const memAfter = takeMemory();
  memPeak = peakMemory(memPeak, memAfter);

  return {
    timing: computeStats(samples),
    memBefore,
    memAfter,
    memPeak,
    cpu: diffCpu(cpuBefore, cpuAfter),
    iterations,
    totalWallMs,
    opsPerSec: iterations / (totalWallMs / 1000),
    framesProduced: iterations,
    bytesProduced: 0,
  };
}

// ── Formatting ──────────────────────────────────────────────────────

export function fmtMs(ms: number): string {
  if (ms < 0.001) return `${(ms * 1_000_000).toFixed(0)}ns`;
  if (ms < 1) return `${(ms * 1000).toFixed(0)}µs`;
  if (ms < 1000) return `${ms.toFixed(2)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function fmtKb(kb: number): string {
  if (kb < 1024) return `${kb}KB`;
  if (kb < 1024 * 1024) return `${(kb / 1024).toFixed(1)}MB`;
  return `${(kb / (1024 * 1024)).toFixed(2)}GB`;
}

export function fmtOps(ops: number): string {
  if (ops < 1000) return `${ops.toFixed(0)} ops/s`;
  if (ops < 1_000_000) return `${(ops / 1000).toFixed(1)}K ops/s`;
  return `${(ops / 1_000_000).toFixed(2)}M ops/s`;
}

export function fmtPercent(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}
