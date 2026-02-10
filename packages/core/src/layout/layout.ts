/**
 * packages/core/src/layout/layout.ts — Widget tree layout computation.
 *
 * Facade file: public import path and exports are stable.
 * Internal implementation lives in `./engine/*` and `./kinds/*`.
 *
 * @see docs/guide/layout.md
 */

export type { LayoutTree } from "./engine/layoutEngine.js";
export { layout, measure } from "./engine/layoutEngine.js";
