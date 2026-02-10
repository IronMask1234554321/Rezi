/**
 * Shared tree builders for all scenarios.
 *
 * Each builder creates an equivalent visual tree at a given size N,
 * using either Rezi native, ink-compat (React), or Ink (React).
 *
 * The trees are semantically identical:
 *   Column(p=1, gap=1) [
 *     Text(bold) "Benchmark: {n} items"
 *     Row(gap=2) [ Text "Total: {n}", Spacer, Text "Page 1" ]
 *     for i in 0..n:
 *       Row(gap=1) [ Text(dim) "{i}.", Text "Item {i}", Text(italic) "details" ]
 *   ]
 */

import { type VNode, ui } from "@rezi-ui/core";
import type React from "react";

// ── Rezi Native ─────────────────────────────────────────────────────

export function buildReziTree(n: number, seed = 0): VNode {
  const rows: VNode[] = [];
  for (let i = 0; i < n; i++) {
    rows.push(
      ui.row({ gap: 1 }, [
        ui.text(`${i}.`, { style: { dim: true } }),
        ui.text(`Item ${i}`),
        ui.text("details", { style: { italic: true } }),
      ]),
    );
  }
  return ui.column({ p: 1, gap: 1 }, [
    ui.text(`Benchmark: ${n} items (#${seed})`, { style: { bold: true } }),
    ui.row({ gap: 2 }, [ui.text(`Total: ${n}`), ui.spacer({ flex: 1 }), ui.text("Page 1")]),
    ...rows,
  ]);
}

// ── React tree builders (used for both Ink and ink-compat) ──────────

/**
 * Build a React element tree using the given component set.
 * `C` must provide Box, Text, and Spacer (matching Ink's API).
 */
export function buildReactTree(
  ReactMod: { createElement: typeof import("react").createElement },
  C: {
    Box: unknown;
    Text: unknown;
    Spacer: unknown;
  },
  n: number,
  seed = 0,
): import("react").ReactNode {
  const h = ReactMod.createElement;
  const rows: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    rows.push(
      h(
        C.Box as string,
        { key: String(i), flexDirection: "row", gap: 1 },
        h(C.Text as string, { dimColor: true }, `${i}.`),
        h(C.Text as string, null, `Item ${i}`),
        h(C.Text as string, { italic: true }, "details"),
      ),
    );
  }
  return h(
    C.Box as string,
    { flexDirection: "column", paddingX: 1, gap: 1 },
    h(C.Text as string, { bold: true }, `Benchmark: ${n} items (#${seed})`),
    h(
      C.Box as string,
      { flexDirection: "row", gap: 2 },
      h(C.Text as string, null, `Total: ${n}`),
      h(C.Spacer as string, null),
      h(C.Text as string, null, "Page 1"),
    ),
    ...rows,
  );
}
