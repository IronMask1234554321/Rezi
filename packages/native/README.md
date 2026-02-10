# @rezi-ui/native

Rust + `napi-rs` Node-API addon that hosts the Zireael C engine and exposes a minimal, safe JS API for the Node backend.

This package is not used directly by most applications. Install and use `@rezi-ui/node`, which depends on this package.

## Local development

Build the native addon for your host platform:

```bash
npm -w @rezi-ui/native run build:native
```

Smoke test:

```bash
npm -w @rezi-ui/native run test:native:smoke
```

## Design and constraints

- Engine ownership lives on a worker thread (never the Node main thread).
- All buffers across the boundary are caller-owned; binary formats are validated strictly.

See:

- [Native addon docs](../../docs/backend/native.md)
- [Releasing](RELEASING.md)
