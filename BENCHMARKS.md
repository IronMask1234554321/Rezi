# Benchmarks

This repository includes a benchmark suite for comparing:

- **Rezi (native)**: `@rezi-ui/core` (direct VNode authoring via `ui.*`)
- **Ink-on-Rezi**: `@rezi-ui/ink-compat` (Ink API surface using React reconciler, rendered by Rezi)
- **Ink**: `ink` (React + Yoga + ANSI output)

These three are intentionally chosen because they can run the *same* component trees and update patterns in the *same* runtime (Node.js), making comparisons more apples-to-apples. Other TUI libraries often have different rendering models (immediate-mode, different layout engines, different buffering), which makes it easy to write unfair benchmarks without additional methodology work.

## Reproducing

```bash
npm ci
npm run build

# Full run (writes JSON + Markdown)
npm run bench -- --output-dir benchmarks/local

# Quick smoke run (fewer iterations)
npm run bench -- --quick --output-dir benchmarks/local-quick
```

### Optional: PTY / real TTY mode

The default benchmark mode uses stub backends to isolate the render pipeline from terminal I/O.

For an additional data point, you can run benchmarks in **PTY mode**, which executes each framework in a pseudo-terminal so that:

- Ink writes to a real TTY stream
- Rezi / Ink-on-Rezi run through the real `@rezi-ui/node` backend, including native present/output

This mode is inherently noisier and is not portable to every environment. It does **not** include terminal emulator rendering cost (it measures the PTY/TTY write path, not how fast a specific emulator paints pixels).

Prerequisite (optional dependency):

```bash
npm i -w @rezi-ui/bench -D node-pty
```

If the native addon cannot be loaded for your platform (no prebuilt binary available), build it locally:

```bash
npm run build:native
```

Run:

```bash
npm run bench -- --io pty --quick --output-dir benchmarks/local-pty-quick
```

## Methodology

### What is measured

The suite supports two I/O modes:

- `--io stub` (default): measures time-to-frame delivery into in-memory stubs.
- `--io pty`: measures time-to-frame delivery through a PTY-backed TTY stream.

In `--io stub`, all scenarios measure **time-to-frame-delivery into a stub backend**:

- **Rezi / Ink-on-Rezi** submit a binary **ZRDL drawlist** into an in-memory `RuntimeBackend` (`BenchBackend`).
- **Ink** writes ANSI output into an in-memory `Writable` (`MeasuringStream`).

This keeps terminal I/O out of the loop and focuses on render/reconcile/layout + output construction.

In `--io pty`, each `(scenario, params, framework)` runs inside a pseudo-terminal (PTY). For Rezi and Ink-on-Rezi this uses the real `@rezi-ui/node` backend (native engine ownership + present/write path). For Ink it uses the real TTY write path.

### What is not measured

- Terminal emulator rendering cost (painting pixels). PTY mode measures writes into a PTY/TTY, not how fast a given emulator draws.
- For `--io stub`: the suite measures Rezi’s **JS/TS-side pipeline up to drawlist submission**. It does **not** measure the native engine’s `present` + terminal diff output stage.

### Controls

- **Process isolation**: each `(scenario, params, framework)` runs in its own Node process. This avoids cross-framework contamination, especially for RSS comparisons.
- **Warmup**: per-scenario warmups are executed and excluded from measured samples.
- **GC**: runs with `node --expose-gc`; forced GC is invoked between framework runs.
- **Fixed terminal size**: backends report `120×40`.
- **Statistics**: per-iteration samples report mean, std dev, percentiles, and a deterministic (seeded) bootstrap **95% CI for the mean**.

### CPU time vs wall time

- **Wall** is `performance.now()` over the measured loop.
- **CPU** is `process.cpuUsage()` (user/system). Note that it can exceed wall time if the process uses multiple threads.

## Results (2026-02-11)

Raw artifacts for this run:

- `benchmarks/2026-02-11-full/results.json`
- `benchmarks/2026-02-11-full/results.md`

This run was generated in the default mode (`--io stub`), i.e. it isolates the render pipeline from real terminal I/O.

PTY dataset for the same day (real TTY write path):

- `benchmarks/2026-02-11-pty/results.json`
- `benchmarks/2026-02-11-pty/results.md`

Terminal competitor suite (adds `blessed` and `ratatui`):

- `benchmarks/2026-02-11-terminal/results.json`
- `benchmarks/2026-02-11-terminal/results.md`

Environment (from the run header):

- Node: v20.19.5
- OS: Linux 6.6.87.2-microsoft-standard-WSL2
- Arch: linux x64
- CPU: AMD Ryzen 7 9800X3D 8-Core Processor
- RAM: 15993MB

### Tree Construction

Build a complete widget tree from scratch (size sweep):

#### items=10

| Framework | Mean | Std dev | Mean CI95 | ops/s | Wall | CPU user | CPU sys | Peak RSS | Peak Heap |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Rezi (native) | 56µs | 63µs | 51µs–62µs | 17.7K ops/s | 28.29ms | 71.10ms | 6.68ms | 68.4MB | 16.8MB |
| Ink-on-Rezi | 228µs | 101µs | 220µs–237µs | 4.4K ops/s | 114.15ms | 169.52ms | 25.72ms | 89.4MB | 26.8MB |
| Ink | 17.44ms | 15.76ms | 16.17ms–18.82ms | 57 ops/s | 8.72s | 479.69ms | 30.85ms | 110.0MB | 31.2MB |

#### items=100

| Framework | Mean | Std dev | Mean CI95 | ops/s | Wall | CPU user | CPU sys | Peak RSS | Peak Heap |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Rezi (native) | 194µs | 128µs | 185µs–207µs | 5.1K ops/s | 97.58ms | 112.44ms | 13.80ms | 118.3MB | 49.3MB |
| Ink-on-Rezi | 1.15ms | 205µs | 1.13ms–1.17ms | 871 ops/s | 574.30ms | 622.45ms | 32.83ms | 149.7MB | 76.0MB |
| Ink | 19.69ms | 14.00ms | 18.53ms–20.93ms | 51 ops/s | 9.84s | 3.10s | 204.06ms | 148.4MB | 68.7MB |

#### items=500

| Framework | Mean | Std dev | Mean CI95 | ops/s | Wall | CPU user | CPU sys | Peak RSS | Peak Heap |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Rezi (native) | 780µs | 285µs | 758µs–808µs | 1.3K ops/s | 390.63ms | 464.19ms | 29.74ms | 141.9MB | 65.7MB |
| Ink-on-Rezi | 5.50ms | 694µs | 5.44ms–5.57ms | 182 ops/s | 2.75s | 3.25s | 144.40ms | 192.0MB | 102.6MB |
| Ink | 33.31ms | 10.36ms | 32.43ms–34.21ms | 30 ops/s | 16.66s | 15.75s | 1.52s | 226.9MB | 143.5MB |

#### items=1000

| Framework | Mean | Std dev | Mean CI95 | ops/s | Wall | CPU user | CPU sys | Peak RSS | Peak Heap |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Rezi (native) | 1.47ms | 436µs | 1.43ms–1.51ms | 682 ops/s | 733.18ms | 896.34ms | 82.94ms | 144.3MB | 67.8MB |
| Ink-on-Rezi | 10.90ms | 1.10ms | 10.82ms–11.02ms | 92 ops/s | 5.45s | 6.31s | 328.58ms | 226.1MB | 51.1MB |
| Ink | 50.45ms | 6.49ms | 49.89ms–51.06ms | 20 ops/s | 25.23s | 29.61s | 2.32s | 330.3MB | 201.3MB |

Commentary:

- Rezi’s construction numbers reflect work in the JS/TS pipeline up to drawlist emission.
- Ink’s construction includes Yoga layout + ANSI output generation; in this run it shows a higher wall-clock cost and higher peak RSS for larger trees.

### Rerender Cost

Single state change on a small mounted app:

| Framework | Mean | Std dev | Mean CI95 | ops/s | Wall | CPU user | CPU sys | Peak RSS | Peak Heap |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Rezi (native) | 34µs | 39µs | 32µs–37µs | 28.9K ops/s | 34.57ms | 82.81ms | 9.57ms | 70.3MB | 18.7MB |
| Ink-on-Rezi | 86µs | 61µs | 83µs–90µs | 11.5K ops/s | 86.63ms | 189.46ms | 3.57ms | 86.1MB | 23.1MB |
| Ink | 16.37ms | 16.06ms | 15.41ms–17.35ms | 61 ops/s | 16.37s | 381.36ms | 55.57ms | 104.4MB | 30.8MB |

Commentary:

- In this environment, Ink’s per-update latency has a consistent ~16ms floor in the measured pipeline (time-to-next write). The suite does not attempt to bypass framework scheduling.

### Layout Stress

Nested rows/columns; varying text widths each frame to force re-layout:

| Framework | Mean | Std dev | Mean CI95 | ops/s | Wall | CPU user | CPU sys | Peak RSS | Peak Heap |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Rezi (native) | 1.15ms | 308µs | 1.12ms–1.19ms | 866 ops/s | 346.53ms | 388.83ms | 31.02ms | 134.3MB | 55.6MB |
| Ink-on-Rezi | 2.21ms | 334µs | 2.18ms–2.25ms | 451 ops/s | 664.65ms | 696.13ms | 83.97ms | 142.5MB | 58.9MB |
| Ink | 20.10ms | 13.83ms | 18.56ms–21.66ms | 50 ops/s | 6.03s | 1.96s | 134.80ms | 140.6MB | 55.5MB |

Commentary:

- Layout-heavy workloads reduce the relative gap between Rezi native and Ink-on-Rezi (React reconciler overhead is a larger share of the total for smaller trees, and a smaller share when layout dominates).

### Scroll Stress

Non-virtualized list: render all items every frame; move active row each iteration:

| Framework | Mean | Std dev | Mean CI95 | ops/s | Wall | CPU user | CPU sys | Peak RSS | Peak Heap |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Rezi (native) | 10.72ms | 2.83ms | 10.01ms–11.52ms | 93 ops/s | 536.01ms | 677.27ms | 189.08ms | 172.0MB | 82.2MB |
| Ink-on-Rezi | 39.89ms | 4.93ms | 38.67ms–41.36ms | 25 ops/s | 1.99s | 2.42s | 291.35ms | 245.6MB | 93.9MB |
| Ink | 133.37ms | 13.10ms | 129.98ms–136.93ms | 7 ops/s | 6.67s | 7.42s | 995.17ms | 346.4MB | 179.7MB |

Commentary:

- This scenario is intentionally worst-case. In typical UIs, a large list would be virtualized; see the next section.

### Large List Virtualization

Logical dataset of 100,000 items; render a viewport of 40 items; move the window by 1 each iteration:

| Framework | Mean | Std dev | Mean CI95 | ops/s | Wall | CPU user | CPU sys | Peak RSS | Peak Heap |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Rezi (native) | 214µs | 133µs | 207µs–223µs | 4.6K ops/s | 215.07ms | 257.55ms | 29.18ms | 131.8MB | 55.6MB |
| Ink-on-Rezi | 752µs | 190µs | 741µs–764µs | 1.3K ops/s | 752.47ms | 871.16ms | 33.67ms | 156.7MB | 78.6MB |
| Ink | 18.37ms | 15.00ms | 17.58ms–19.27ms | 54 ops/s | 18.37s | 3.65s | 292.85ms | 120.5MB | 42.8MB |

Commentary:

- When application-level virtualization keeps the rendered tree bounded, Rezi and Ink-on-Rezi scale more predictably under repeated small state changes.

### Tables

Fixed table (100×8); update a changing cell per iteration:

| Framework | Mean | Std dev | Mean CI95 | ops/s | Wall | CPU user | CPU sys | Peak RSS | Peak Heap |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Rezi (native) | 2.00ms | 835µs | 1.90ms–2.10ms | 500 ops/s | 600.02ms | 620.98ms | 44.59ms | 133.6MB | 67.5MB |
| Ink-on-Rezi | 5.10ms | 937µs | 4.99ms–5.21ms | 196 ops/s | 1.53s | 1.74s | 83.90ms | 147.5MB | 37.7MB |
| Ink | 22.88ms | 11.27ms | 21.69ms–24.22ms | 44 ops/s | 6.86s | 4.20s | 517.38ms | 161.2MB | 73.3MB |

## PTY Results (2026-02-11)

These are the same scenarios executed in `--io pty` mode (pseudo-terminal). Compared to `--io stub`, this includes substantially more of the real output path, so the absolute numbers and ratios are not directly comparable to the stub dataset.

Raw artifacts:

- `benchmarks/2026-02-11-pty/results.json`
- `benchmarks/2026-02-11-pty/results.md`

### Tree Construction (items=1000)

| Framework | Mean | Std dev | Mean CI95 | ops/s | Wall | CPU user | CPU sys | Peak RSS | Peak Heap |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Rezi (native) | 1.81ms | 533µs | 1.76ms–1.86ms | 553 ops/s | 904.76ms | 1.14s | 109.28ms | 159.0MB | 79.6MB |
| Ink-on-Rezi | 11.27ms | 1.04ms | 11.19ms–11.38ms | 89 ops/s | 5.64s | 6.50s | 343.78ms | 235.8MB | 53.3MB |
| Ink | 53.15ms | 6.78ms | 52.57ms–53.77ms | 19 ops/s | 26.58s | 31.06s | 2.64s | 335.6MB | 230.0MB |

### Rerender Cost

| Framework | Mean | Std dev | Mean CI95 | ops/s | Wall | CPU user | CPU sys | Peak RSS | Peak Heap |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Rezi (native) | 353µs | 36µs | 351µs–356µs | 2.8K ops/s | 354.46ms | 405.00ms | 16.41ms | 77.9MB | 19.2MB |
| Ink-on-Rezi | 414µs | 49µs | 411µs–417µs | 2.4K ops/s | 414.75ms | 468.87ms | 54.72ms | 89.7MB | 23.5MB |
| Ink | 16.52ms | 16.04ms | 15.58ms–17.49ms | 61 ops/s | 16.52s | 445.52ms | 85.09ms | 105.9MB | 29.3MB |

### Layout Stress

| Framework | Mean | Std dev | Mean CI95 | ops/s | Wall | CPU user | CPU sys | Peak RSS | Peak Heap |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Rezi (native) | 1.59ms | 322µs | 1.56ms–1.63ms | 629 ops/s | 476.76ms | 520.18ms | 41.55ms | 137.3MB | 66.2MB |
| Ink-on-Rezi | 2.50ms | 300µs | 2.47ms–2.53ms | 400 ops/s | 750.07ms | 801.99ms | 57.88ms | 147.5MB | 55.6MB |
| Ink | 21.04ms | 13.83ms | 19.52ms–22.66ms | 48 ops/s | 6.31s | 2.01s | 172.18ms | 146.6MB | 43.9MB |

### Scroll Stress (items=2000)

| Framework | Mean | Std dev | Mean CI95 | ops/s | Wall | CPU user | CPU sys | Peak RSS | Peak Heap |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Rezi (native) | 11.78ms | 3.01ms | 11.01ms–12.62ms | 85 ops/s | 588.86ms | 751.26ms | 185.98ms | 205.6MB | 134.8MB |
| Ink-on-Rezi | 44.50ms | 7.85ms | 42.52ms–46.71ms | 22 ops/s | 2.23s | 2.69s | 275.00ms | 246.0MB | 109.7MB |
| Ink | 144.86ms | 16.79ms | 140.49ms–149.46ms | 7 ops/s | 7.24s | 8.09s | 1.06s | 553.3MB | 448.5MB |

### Large List Virtualization (items=100000, viewport=40)

| Framework | Mean | Std dev | Mean CI95 | ops/s | Wall | CPU user | CPU sys | Peak RSS | Peak Heap |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Rezi (native) | 573µs | 135µs | 565µs–582µs | 1.7K ops/s | 573.91ms | 583.81ms | 68.50ms | 134.9MB | 57.4MB |
| Ink-on-Rezi | 1.13ms | 210µs | 1.12ms–1.14ms | 886 ops/s | 1.13s | 1.23s | 54.05ms | 151.2MB | 73.4MB |
| Ink | 19.23ms | 14.78ms | 18.41ms–20.14ms | 52 ops/s | 19.23s | 3.99s | 303.96ms | 127.2MB | 43.2MB |

### Tables (rows=100, cols=8)

| Framework | Mean | Std dev | Mean CI95 | ops/s | Wall | CPU user | CPU sys | Peak RSS | Peak Heap |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Rezi (native) | 2.36ms | 847µs | 2.27ms–2.46ms | 423 ops/s | 709.78ms | 746.67ms | 37.87ms | 134.2MB | 66.5MB |
| Ink-on-Rezi | 5.55ms | 972µs | 5.44ms–5.66ms | 180 ops/s | 1.67s | 1.89s | 66.56ms | 154.3MB | 41.7MB |
| Ink | 24.26ms | 11.65ms | 22.95ms–25.64ms | 41 ops/s | 7.28s | 4.53s | 460.32ms | 162.6MB | 67.6MB |

### Memory Profile

| Framework | Mean | Std dev | Mean CI95 | ops/s | Wall | CPU user | CPU sys | Peak RSS | Peak Heap |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Rezi (native) | 468µs | 75µs | 465µs–471µs | 2.1K ops/s | 938.17ms | 1.07s | 44.32ms | 108.2MB | 39.3MB |
| Ink-on-Rezi | 560µs | 99µs | 555µs–564µs | 1.8K ops/s | 1.12s | 1.23s | 87.70ms | 122.4MB | 46.6MB |
| Ink | 17.20ms | 15.68ms | 16.60ms–17.89ms | 58 ops/s | 34.41s | 2.13s | 255.62ms | 114.3MB | 35.7MB |

## Terminal Competitors (2026-02-11)

This repository also includes a separate **terminal suite** intended to compare Rezi (TypeScript/Node.js) against:

- `blessed` (Node.js)
- `ratatui` (Rust)

Because these libraries do not share a common component model, the suite is scoped to viewport-sized, text-based workloads that can be implemented consistently across all frameworks.

### Reproducing

Build the Ratatui benchmark binary:

```bash
cd benchmarks/native/ratatui-bench
cargo build --release
```

Run the terminal suite in PTY mode:

```bash
npm run bench -- --suite terminal --io pty --output-dir benchmarks/local-terminal
```

Notes:

- `blessed` benchmarks require PTY mode (`--io pty`) because it assumes a TTY-like output stream.
- `ratatui` is invoked via the standalone binary at `benchmarks/native/ratatui-bench/target/release/ratatui-bench`. Override with `REZI_RATATUI_BENCH_BIN=/path/to/ratatui-bench`.
- For `ratatui`, the suite reports **RSS only** (no V8 heap metrics). `Peak Heap` is reported as `n/a`.

### Results summary (PTY mode)

Artifacts:

- `benchmarks/2026-02-11-terminal/results.json`
- `benchmarks/2026-02-11-terminal/results.md`

Selected means from that dataset:

| Scenario | ratatui (Rust) | blessed (Node) | Rezi (native) | Ink |
|---|---:|---:|---:|---:|
| `terminal-rerender` | 74µs | 126µs | 322µs | 16.39ms |
| `terminal-frame-fill` (`dirtyLines=1`) | 197µs | 137µs | 567µs | 17.73ms |
| `terminal-frame-fill` (`dirtyLines=40`) | 211µs | 256µs | 610µs | 17.66ms |
| `terminal-virtual-list` | 126µs | 218µs | 584µs | 18.88ms |
| `terminal-table` | 178µs | 188µs | 493µs | 17.44ms |

Notes:

- All scenarios use a fixed 120×40 terminal size.
- For `ratatui` (Rust), V8 heap metrics do not apply; only RSS is comparable. `Peak Heap` is reported as `n/a` in the raw results.
- These libraries do not share a component model or layout engine, so the internal work per frame differs even when the visual output is equivalent. Workloads are chosen to produce comparable on-screen results, not identical code paths.
- The terminal suite is a **microbenchmark** of viewport-sized updates. It is useful for positioning Rezi relative to a Node.js baseline (`blessed`) and a native baseline (`ratatui`), but does not reflect full-application complexity.
- Absolute results are sensitive to TTY buffering/throughput, OS scheduling, and the host environment (this run used WSL2). Compare within the same dataset and run header.

## Notes / Limitations

- Microbenchmarks are sensitive to CPU frequency scaling, background load, VM/WSL overhead, and Node/V8 version changes.
- Memory (RSS) is especially noisy; this suite isolates processes per run, but RSS still reflects allocator behavior and OS decisions, not just framework allocation.
- Comparisons across frameworks are only meaningful at the “render pipeline into backend” boundary described above; real-world apps may be bottlenecked elsewhere (I/O, async work, business logic).
