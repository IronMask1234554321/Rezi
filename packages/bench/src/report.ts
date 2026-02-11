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
  "terminal-kit": "terminal-kit",
  blessed: "blessed",
  ratatui: "Ratatui (Rust)",
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

    const order: Framework[] = [
      "rezi-native",
      "ink-compat",
      "ink",
      "terminal-kit",
      "blessed",
      "ratatui",
    ];
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

    const order: Framework[] = [
      "rezi-native",
      "ink-compat",
      "ink",
      "terminal-kit",
      "blessed",
      "ratatui",
    ];
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

  // Summary: relative performance (ratio = other / rezi; >1 means rezi is faster)
  lines.push("## Relative Performance (vs Rezi native)\n");
  lines.push(
    '> "Xx slower" = Rezi native is X times faster. "Xx faster" = other framework is faster.\n',
  );

  // Determine which frameworks have results
  const allFws: Framework[] = ["ink", "ink-compat", "terminal-kit", "blessed", "ratatui"];
  const presentFws = allFws.filter((fw) =>
    [...groups.values()].some((items) => items.some((r) => r.framework === fw)),
  );

  const headerCols = presentFws.map((fw) => FRAMEWORK_LABELS[fw]);
  lines.push(`| Scenario | ${headerCols.join(" | ")} |`);
  lines.push(`|---|${presentFws.map(() => "---:").join("|")}|`);

  for (const [group, items] of groups) {
    const nativeResult = items.find((r) => r.framework === "rezi-native");
    const nativeMean = nativeResult?.metrics.timing.mean ?? 0;

    const fmtRatio = (fw: Framework) => {
      const other = items.find((r) => r.framework === fw);
      if (!other || nativeMean <= 0) return "N/A";
      const ratio = other.metrics.timing.mean / nativeMean;
      return ratio >= 1 ? `${ratio.toFixed(1)}x slower` : `${(1 / ratio).toFixed(1)}x faster`;
    };

    const cols = presentFws.map(fmtRatio);
    lines.push(`| ${group} | ${cols.join(" | ")} |`);
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
