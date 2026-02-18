# Testing

Run the full test suite:

```bash
npm test
```

The repo uses:

- unit tests for pure modules
- golden tests for drawlists/layout/routing where byte-level stability matters
- fuzz-lite tests for binary parsers (bounded, never-throw)

## Reconciliation Hardening Matrix

Reconciliation edge-cases are covered by dedicated runtime suites:

- `packages/core/src/runtime/__tests__/reconcile.keyed.test.ts`
- `packages/core/src/runtime/__tests__/reconcile.unkeyed.test.ts`
- `packages/core/src/runtime/__tests__/reconcile.mixed.test.ts`
- `packages/core/src/runtime/__tests__/reconcile.composite.test.ts`
- `packages/core/src/runtime/__tests__/reconcile.deep.test.ts`

These suites lock deterministic behavior for keyed reorder/insert/remove, unkeyed grow/shrink,
mixed keyed+unkeyed slots, `defineWidget` hook/state persistence, and deep-tree reconciliation.

Related CI gates:

- [Perf Regressions](./perf-regressions.md)
- [Repro Replay](./repro-replay.md)
