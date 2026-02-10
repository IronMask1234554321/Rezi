# @rezi-ui/native — Prebuild + Packaging (P1)

This package is the napi-rs native addon that hosts the Zireael C engine.

Platform strategy + matrix are defined in the native addon documentation:

- [Native addon docs](../../docs/backend/native.md)

Current build targets:
- Windows x64/arm64 (MSVC)
- macOS x64/arm64
- Linux x64/arm64 (glibc)

## Run the prebuild workflow (CI)

The prebuild pipeline is implemented as a separate workflow so normal CI stays fast:
- `.github/workflows/prebuild.yml`

Trigger it via GitHub Actions UI (Workflow Dispatch), or via `gh`:

```bash
gh workflow run prebuild.yml --ref main
```

Artifacts uploaded by the workflow are the per-target prebuilt `.node` binaries.

## Verify `npm pack` contents + install smoke (CI / local)

The workflow runs deterministic packaging verification:
- `scripts/verify-native-pack.mjs`

It:
1) verifies the expected `.node` binaries exist in `packages/native/`
2) runs `npm pack` and validates tarball contents contain the expected binaries
3) installs the tarball into a temp dir and runs a smoke test that loads the addon and calls `engineCreate/engineDestroy` (or deterministically skips if platform init is unavailable without a TTY)

To run locally (requires the expected `.node` files to already be present in `packages/native/`):

```bash
node scripts/verify-native-pack.mjs
```

For a host-only sanity check (useful during local development after building only your host binary):

```bash
npm -w @rezi-ui/native run build:native
node scripts/verify-native-pack.mjs --host-only
```

## Smoke test only

Run the native smoke test directly:

```bash
npm -w @rezi-ui/native run test:native:smoke
```
