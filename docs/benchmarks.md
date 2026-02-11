# Benchmarks

Rezi includes a benchmark suite comparing three pipelines:

- **Rezi (native)**: `@rezi-ui/core` via `ui.*` VNodes
- **Ink-on-Rezi**: `@rezi-ui/ink-compat` (React reconciler + Rezi backend)
- **Ink**: `ink` (React + Yoga + ANSI output)

The authoritative benchmark write-up and the latest committed results live in the repository:

- `BENCHMARKS.md`
- `benchmarks/` (structured JSON + generated Markdown)
- GitHub: https://github.com/RtlZeroMemory/Rezi/blob/main/BENCHMARKS.md

## Running benchmarks

```bash
npm ci
npm run build

node --expose-gc packages/bench/dist/run.js --output-dir benchmarks/local
```

For a faster smoke run:

```bash
node --expose-gc packages/bench/dist/run.js --quick --output-dir benchmarks/local-quick
```

Optional PTY mode (real TTY path; requires `node-pty`):

```bash
npm i -w @rezi-ui/bench -D node-pty
node --expose-gc packages/bench/dist/run.js --io pty --quick --output-dir benchmarks/local-pty-quick
```

Terminal competitor suite (adds `blessed` and `ratatui`; PTY-only):

```bash
cd benchmarks/native/ratatui-bench
cargo build --release
cd -

node --expose-gc packages/bench/dist/run.js --suite terminal --io pty --output-dir benchmarks/local-terminal
```

## Interpreting results

See `BENCHMARKS.md` for:

- Scenario definitions (tree construction, rerender, layout stress, scroll stress, virtualization, tables)
- Methodology notes (process isolation, warmup/GC, what is measured vs not measured)
- CPU time vs wall time
