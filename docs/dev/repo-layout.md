# Repo layout

Top-level folders:

- `packages/*` — workspace packages
- `examples/*` — runnable examples
- `docs/` — MkDocs site (GitHub Pages)
- `vendor/zireael` — Zireael source pinned as a git submodule (used for syncing vendored snapshots)

Native build uses `packages/native/vendor/zireael` as the compile-time snapshot.

