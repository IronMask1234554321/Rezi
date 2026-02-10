/**
 * Scenario registry — all available benchmark scenarios.
 */

import type { Scenario } from "../types.js";
import { constructionScenario } from "./construction.js";
import { memoryScenario } from "./memory.js";
import { rerenderScenario } from "./rerender.js";

export const scenarios: readonly Scenario[] = [
  constructionScenario,
  rerenderScenario,
  memoryScenario,
];

export function findScenario(name: string): Scenario | undefined {
  return scenarios.find((s) => s.name === name);
}
