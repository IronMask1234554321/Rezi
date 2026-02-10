# Governance

Rezi is maintained as a determinism-first terminal UI framework with strict safety and module boundaries.

## Roles

- **Maintainers**: review and merge pull requests, cut releases, own roadmap decisions.
- **Contributors**: propose changes via issues/PRs, improve tests/docs/widgets/backends.

## Decision making

Default approach:

1. Open an issue (or PR) with a concrete proposal and examples.
2. Prefer small, reviewable changes over broad refactors.
3. If consensus isn’t reached, maintainers decide with project constraints as the rubric.

## Compatibility policy (high level)

- `@rezi-ui/core` is the primary public API surface.
- Binary protocols (drawlists and event batches) are versioned and must remain backward compatible within a major line.
- Behavior changes should be deterministic and documented.

## Security and safety

Please follow `SECURITY.md`. For crashers, include:

- OS + terminal emulator
- Node version
- minimal reproduction
- any relevant binary dumps (drawlist/event batch) if available

