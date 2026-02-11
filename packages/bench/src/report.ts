/**
 * Benchmark report formatting.
 *
 * Outputs results as:
 *   - Terminal table (colored, for quick viewing)
 *   - Markdown table (for README / docs)
 *   - JSON (for automated tracking / CI)
 */

import { fmtKb, fmtMs, fmtOps } from "./measure.js";
import type { BenchResult, BenchRun, Framework } from "./types.js";

function fmtCi95(lowMs: number, highMs: number): string {
  if (!Number.isFinite(lowMs) || !Number.isFinite(highMs)) return "n/a";
  if (lowMs === 0 && highMs === 0) return "n/a";
  return `${fmtMs(lowMs)}–${fmtMs(highMs)}`;
}

function fmtKbOpt(kb: number | null): string {
  return kb === null ? "n/a" : fmtKb(kb);
}

// ── Terminal Table ──────────────────────────────────────────────────

function pad(s: string, w: number, align: "left" | "right" = "left"): string {
  if (s.length >= w) return s.slice(0, w);
  const gap = w - s.length;
  return align === "right" ? " ".repeat(gap) + s : s + " ".repeat(gap);
}

const FRAMEWORK_LABELS: Record<Framework, string> = {
  "rezi-native": "Rezi (native)",
  "ink-compat": "Ink-on-Rezi",
  ink: "Ink",
  blessed: "blessed",
  ratatui: "ratatui",
};

export function printTerminalTable(results: readonly BenchResult[]): void {
  // Group by scenario+params
  const groups = new Map<string, BenchResult[]>();
  for (const r of results) {
    const paramStr = Object.entries(r.params)
      .map(([k, v]) => `${k}=${v}`)
      .join(",");
    const key = paramStr ? `${r.scenario} (${paramStr})` : r.scenario;
    const arr = groups.get(key) ?? [];
    arr.push(r);
    groups.set(key, arr);
  }

  for (const [group, items] of groups) {
    console.log(`\n  ${group}`);
    console.log(`  ${"─".repeat(118)}`);
    const header = [
      pad("Framework", 16),
      pad("Mean", 12, "right"),
      pad("Stddev", 12, "right"),
      pad("Mean CI95", 18, "right"),
      pad("ops/s", 14, "right"),
      pad("Wall", 12, "right"),
      pad("CPU (u+s)", 12, "right"),
      pad("RSS", 10, "right"),
      pad("Heap", 10, "right"),
      pad("Bytes", 12, "right"),
    ].join("");
    console.log(`  ${header}`);
    console.log(`  ${"─".repeat(118)}`);

    // Sort: rezi-native first, then ink-compat, then ink
    const order: Framework[] = ["ratatui", "rezi-native", "ink-compat", "ink", "blessed"];
    const sorted = [...items].sort(
      (a, b) => order.indexOf(a.framework) - order.indexOf(b.framework),
    );

    const baseline = sorted[0]?.metrics.timing.mean ?? 1;

    for (const r of sorted) {
      const m = r.metrics;
      const speedup =
        r.framework === sorted[0]?.framework
          ? ""
          : ` (${(m.timing.mean / baseline).toFixed(1)}x slower)`;
      const bytesPerFrameKb = m.bytesProduced / Math.max(1, m.framesProduced) / 1024;
      const row = [
        pad(FRAMEWORK_LABELS[r.framework] ?? r.framework, 16),
        pad(fmtMs(m.timing.mean), 12, "right"),
        pad(fmtMs(m.timing.stddev), 12, "right"),
        pad(fmtCi95(m.timing.meanCi95Low, m.timing.meanCi95High), 18, "right"),
        pad(fmtOps(m.opsPerSec), 14, "right"),
        pad(fmtMs(m.totalWallMs), 12, "right"),
        pad(fmtMs(m.cpu.userMs + m.cpu.systemMs), 12, "right"),
        pad(fmtKb(m.memPeak.rssKb), 10, "right"),
        pad(fmtKbOpt(m.memPeak.heapUsedKb), 10, "right"),
        pad(fmtKb(bytesPerFrameKb), 12, "right"),
      ].join("");

      console.log(`  ${row}${speedup}`);
    }
  }
  console.log();
}

// ── Markdown Table ──────────────────────────────────────────────────

export function toMarkdown(run: BenchRun): string {
  const { meta, invocation, results } = run;
  const lines: string[] = [];
  lines.push("# Benchmark Results\n");
  lines.push(
    `> ${meta.timestamp} | Node ${meta.nodeVersion} | ${meta.osType} ${meta.osRelease} | ${meta.platform} ${meta.arch} | ${meta.cpuModel} (${meta.cpuCores} cores) | RAM ${meta.memoryTotalMb}MB\n`,
  );
  lines.push(
    `> Invocation: suite=${invocation.suite} scenario=${invocation.scenarioFilter ?? "all"} framework=${invocation.frameworkFilter ?? "all"} warmup=${invocation.warmupOverride ?? "default"} iterations=${invocation.iterationsOverride ?? "default"} quick=${invocation.quick ? "yes" : "no"} io=${invocation.ioMode}\n`,
  );

  // Group by scenario+params
  const groups = new Map<string, BenchResult[]>();
  for (const r of results) {
    const paramStr = Object.entries(r.params)
      .map(([k, v]) => `${k}=${v}`)
      .join(", ");
    const key = paramStr ? `${r.scenario} (${paramStr})` : r.scenario;
    const arr = groups.get(key) ?? [];
    arr.push(r);
    groups.set(key, arr);
  }

  for (const [group, items] of groups) {
    lines.push(`## ${group}\n`);
    lines.push(
      "| Framework | Mean | Std dev | Mean CI95 | ops/s | Wall | CPU user | CPU sys | Peak RSS | Peak Heap | Bytes |",
    );
    lines.push("|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|");

    const order: Framework[] = ["ratatui", "rezi-native", "ink-compat", "ink", "blessed"];
    const sorted = [...items].sort(
      (a, b) => order.indexOf(a.framework) - order.indexOf(b.framework),
    );

    for (const r of sorted) {
      const m = r.metrics;
      lines.push(
        `| ${FRAMEWORK_LABELS[r.framework]} | ${fmtMs(m.timing.mean)} | ${fmtMs(m.timing.stddev)} | ${fmtCi95(m.timing.meanCi95Low, m.timing.meanCi95High)} | ${fmtOps(m.opsPerSec)} | ${fmtMs(m.totalWallMs)} | ${fmtMs(m.cpu.userMs)} | ${fmtMs(m.cpu.systemMs)} | ${fmtKb(m.memPeak.rssKb)} | ${fmtKbOpt(m.memPeak.heapUsedKb)} | ${fmtKb(m.bytesProduced / 1024)} |`,
      );
    }
    lines.push("");
  }

  // Summary: speedup comparison
  lines.push("## Speedup Summary\n");
  lines.push("| Scenario | Ink-on-Rezi vs Ink | Rezi native vs Ink |");
  lines.push("|---|---:|---:|");

  for (const [group, items] of groups) {
    const inkResult = items.find((r) => r.framework === "ink");
    const compatResult = items.find((r) => r.framework === "ink-compat");
    const nativeResult = items.find((r) => r.framework === "rezi-native");

    const inkMean = inkResult?.metrics.timing.mean ?? 0;
    const compatSpeedup =
      compatResult && inkMean > 0
        ? `${(inkMean / compatResult.metrics.timing.mean).toFixed(1)}x`
        : "N/A";
    const nativeSpeedup =
      nativeResult && inkMean > 0
        ? `${(inkMean / nativeResult.metrics.timing.mean).toFixed(1)}x`
        : "N/A";

    lines.push(`| ${group} | ${compatSpeedup} | ${nativeSpeedup} |`);
  }

  lines.push("\n## Memory Comparison\n");
  lines.push(
    "| Scenario | Framework | Peak RSS | Peak Heap | RSS Growth | Heap Growth | RSS Slope | Stable |",
  );
  lines.push("|---|---|---:|---:|---:|---:|---:|---:|");

  for (const [group, items] of groups) {
    for (const r of items) {
      const m = r.metrics;
      const rssGrowth = m.rssGrowthKb;
      const heapGrowth = m.heapUsedGrowthKb;
      const rssGrowthStr =
        rssGrowth > 0
          ? `+${fmtKb(rssGrowth)}`
          : rssGrowth < 0
            ? `-${fmtKb(Math.abs(rssGrowth))}`
            : "0KB";
      const heapGrowthStr =
        heapGrowth === null
          ? "n/a"
          : heapGrowth > 0
            ? `+${fmtKb(heapGrowth)}`
            : heapGrowth < 0
              ? `-${fmtKb(Math.abs(heapGrowth))}`
              : "0KB";
      const slope =
        m.rssSlopeKbPerIter === null ? "N/A" : `${m.rssSlopeKbPerIter.toFixed(4)} KB/iter`;
      const stable = m.memStable === null ? "N/A" : m.memStable ? "yes" : "no";
      lines.push(
        `| ${group} | ${FRAMEWORK_LABELS[r.framework]} | ${fmtKb(m.memPeak.rssKb)} | ${fmtKbOpt(m.memPeak.heapUsedKb)} | ${rssGrowthStr} | ${heapGrowthStr} | ${slope} | ${stable} |`,
      );
    }
  }

  return `${lines.join("\n")}\n`;
}

// ── JSON ────────────────────────────────────────────────────────────

export function toJSON(run: BenchRun): string {
  // Keep artifacts stable across tooling (e.g. formatters) by always
  // ending with a trailing newline.
  return `${JSON.stringify(run, null, 2)}\n`;
}
