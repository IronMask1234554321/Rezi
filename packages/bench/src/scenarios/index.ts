/**
 * Scenario registry — all available benchmark scenarios.
 */

import type { Scenario } from "../types.js";
import { constructionScenario } from "./construction.js";
import { layoutStressScenario } from "./layoutStress.js";
import { memoryScenario } from "./memory.js";
import { rerenderScenario } from "./rerender.js";
import { scrollStressScenario } from "./scrollStress.js";
import { tableScenario } from "./tables.js";
import { terminalFrameFillScenario } from "./terminalFrameFill.js";
import { terminalRerenderScenario } from "./terminalRerender.js";
import { terminalTableScenario } from "./terminalTable.js";
import { terminalVirtualListScenario } from "./terminalVirtualList.js";
import { virtualListScenario } from "./virtualList.js";

export const scenarios: readonly Scenario[] = [
  constructionScenario,
  rerenderScenario,
  layoutStressScenario,
  scrollStressScenario,
  virtualListScenario,
  tableScenario,
  memoryScenario,
  // Cross-framework competitor suite (blessed, ratatui) — run with: --suite terminal --io pty
  terminalRerenderScenario,
  terminalFrameFillScenario,
  terminalVirtualListScenario,
  terminalTableScenario,
];

export function findScenario(name: string): Scenario | undefined {
  return scenarios.find((s) => s.name === name);
}
