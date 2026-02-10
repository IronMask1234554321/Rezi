# Benchmarks

Rezi includes a comprehensive benchmark suite comparing three rendering approaches:

- **Rezi (native)** — direct `ui.*()` VNode construction, no React overhead
- **Ink-on-Rezi** — React reconciler (`@rezi-ui/ink-compat`) → Rezi rendering engine
- **Ink** — React → Yoga → ANSI escape codes (the standard Ink pipeline)

## Running benchmarks

```bash
node --expose-gc packages/bench/dist/run.js
```

The `--expose-gc` flag is required for accurate memory profiling.

## Results

All benchmarks measured on Node v20, Linux x64.

### tree-construction (items=10)

| Framework | Mean | p95 | p99 | ops/s | Peak RSS | Peak Heap | CPU | Stability (CV) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Rezi (native) | 3µs | 5µs | 14µs | 280.1K ops/s | 89.2MB | 20.9MB | 4.75ms | 97.4% |
| Ink-on-Rezi | 235µs | 430µs | 747µs | 4.2K ops/s | 117.6MB | 38.2MB | 201.47ms | 49.3% |
| Ink | 16.95ms | 33.57ms | 33.88ms | 59 ops/s | 119.3MB | 39.8MB | 713.58ms | 94.7% |

### tree-construction (items=100)

| Framework | Mean | p95 | p99 | ops/s | Peak RSS | Peak Heap | CPU | Stability (CV) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Rezi (native) | 5µs | 6µs | 8µs | 192.5K ops/s | 112.3MB | 33.9MB | 4.45ms | 256.6% |
| Ink-on-Rezi | 1.39ms | 1.93ms | 2.23ms | 717 ops/s | 153.7MB | 75.3MB | 802.50ms | 18.0% |
| Ink | 23.53ms | 40.78ms | 41.73ms | 42 ops/s | 174.4MB | 78.1MB | 5.47s | 68.5% |

### tree-construction (items=500)

| Framework | Mean | p95 | p99 | ops/s | Peak RSS | Peak Heap | CPU | Stability (CV) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Rezi (native) | 20µs | 22µs | 103µs | 50.4K ops/s | 114.3MB | 35.9MB | 12.65ms | 159.5% |
| Ink-on-Rezi | 6.28ms | 7.61ms | 9.07ms | 159 ops/s | 222.0MB | 140.0MB | 3.81s | 11.8% |
| Ink | 51.92ms | 71.32ms | 74.86ms | 19 ops/s | 219.9MB | 130.4MB | 25.88s | 31.7% |

### tree-construction (items=1000)

| Framework | Mean | p95 | p99 | ops/s | Peak RSS | Peak Heap | CPU | Stability (CV) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Rezi (native) | 50µs | 74µs | 437µs | 19.8K ops/s | 130.5MB | 42.1MB | 34.02ms | 164.6% |
| Ink-on-Rezi | 13.61ms | 16.02ms | 20.30ms | 73 ops/s | 277.9MB | 168.0MB | 8.78s | 11.6% |
| Ink | 94.13ms | 125.99ms | 136.60ms | 11 ops/s | 335.7MB | 233.8MB | 56.69s | 19.7% |

### rerender

| Framework | Mean | p95 | p99 | ops/s | Peak RSS | Peak Heap | CPU | Stability (CV) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Rezi (native) | 406ns | 380ns | 630ns | 2.00M ops/s | 148.2MB | 36.6MB | 544µs | 851.1% |
| Ink-on-Rezi | 80µs | 193µs | 242µs | 12.4K ops/s | 148.3MB | 37.3MB | 211.08ms | 76.4% |
| Ink | 16.39ms | 32.66ms | 32.87ms | 61 ops/s | 139.0MB | 36.5MB | 569.51ms | 97.9% |

### memory-profile

| Framework | Mean | p95 | p99 | ops/s | Peak RSS | Peak Heap | CPU | Stability (CV) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Rezi (native) | 2µs | 2µs | 3µs | 479.4K ops/s | 133.7MB | 36.1MB | 6.53ms | 78.9% |
| Ink-on-Rezi | 222µs | 338µs | 728µs | 4.5K ops/s | 155.7MB | 52.6MB | 650.42ms | 48.5% |
| Ink | 17.17ms | 33.78ms | 34.04ms | 58 ops/s | 148.4MB | 47.2MB | 3.45s | 93.5% |

## Speedup summary

| Scenario | Ink-on-Rezi vs Ink | Rezi native vs Ink |
|---|---:|---:|
| tree-construction (items=10) | 72.2x | 5,356x |
| tree-construction (items=100) | 16.9x | 4,747x |
| tree-construction (items=500) | 8.3x | 2,658x |
| tree-construction (items=1000) | 6.9x | 1,876x |
| rerender | 205.1x | 40,405x |
| memory-profile | 77.5x | 9,182x |

## Memory comparison

| Scenario | Framework | Peak RSS | Peak Heap | Mem Growth |
|---|---|---:|---:|---:|
| tree-construction (items=10) | Rezi (native) | 89.2MB | 20.9MB | 0KB |
| tree-construction (items=10) | Ink-on-Rezi | 117.6MB | 38.2MB | +19.4MB |
| tree-construction (items=10) | Ink | 119.3MB | 39.8MB | +7.4MB |
| tree-construction (items=100) | Rezi (native) | 112.3MB | 33.9MB | 0KB |
| tree-construction (items=100) | Ink-on-Rezi | 153.7MB | 75.3MB | +37.8MB |
| tree-construction (items=100) | Ink | 174.4MB | 78.1MB | +5.7MB |
| tree-construction (items=500) | Rezi (native) | 114.3MB | 35.9MB | -152KB |
| tree-construction (items=500) | Ink-on-Rezi | 222.0MB | 140.0MB | +58.3MB |
| tree-construction (items=500) | Ink | 219.9MB | 130.4MB | +26.7MB |
| tree-construction (items=1000) | Rezi (native) | 130.5MB | 42.1MB | 0KB |
| tree-construction (items=1000) | Ink-on-Rezi | 277.9MB | 168.0MB | +90.3MB |
| tree-construction (items=1000) | Ink | 335.7MB | 233.8MB | +47.4MB |
| rerender | Rezi (native) | 148.2MB | 36.6MB | 0KB |
| rerender | Ink-on-Rezi | 148.3MB | 37.3MB | -4.4MB |
| rerender | Ink | 139.0MB | 36.5MB | +6.1MB |
| memory-profile | Rezi (native) | 133.7MB | 36.1MB | 0KB |
| memory-profile | Ink-on-Rezi | 155.7MB | 52.6MB | +16.6MB |
| memory-profile | Ink | 148.4MB | 47.2MB | +12.1MB |

## What each scenario measures

### Tree construction

Measures the time to build a widget tree from scratch. This simulates the initial render of an application with varying numbers of list items (10, 100, 500, 1000). Each iteration constructs a complete tree with a header, list items, and a footer.

### Rerender

Measures the time to update an already-mounted application with a state change. This simulates the common case of UI updates in response to user interaction. Only the changed nodes are updated.

### Memory profile

Measures memory allocation patterns during repeated tree construction and teardown cycles. Tracks Peak RSS, heap usage, and memory growth to detect leaks.

## Interpretation notes

- **Ink's ~16ms floor**: Ink internally throttles renders to 32ms intervals. This means even trivially fast operations appear to take ~16ms on average. This is an architectural choice, not a benchmark artifact.
- **Rezi native vs Ink-on-Rezi**: The gap between these two shows the overhead of the React reconciler. For applications that need React compatibility, ink-compat is still dramatically faster than stock Ink.
- **Stability (CV)**: Coefficient of variation — lower means more consistent timing. Rezi native has higher CV at small scales because the measurements are in microseconds, where OS scheduling noise is proportionally larger.
