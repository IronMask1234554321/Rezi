# Benchmark Results

> 2026-02-11T12:25:44.450Z | Node v20.19.5 | Linux 6.6.87.2-microsoft-standard-WSL2 | linux x64 | AMD Ryzen 7 9800X3D 8-Core Processor (12 cores) | RAM 15993MB

> Invocation: suite=terminal scenario=all framework=all warmup=default iterations=default quick=no io=pty

## terminal-rerender

| Framework | Mean | Std dev | Mean CI95 | ops/s | Wall | CPU user | CPU sys | Peak RSS | Peak Heap | Bytes |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| ratatui | 74µs | 5µs | 74µs–74µs | 13.5K ops/s | 73.98ms | 65.92ms | 15.63ms | 4.8MB | n/a | 28.080078125KB |
| Rezi (native) | 322µs | 29µs | 321µs–324µs | 3.1K ops/s | 323.51ms | 342.77ms | 25.93ms | 66.4MB | 13.9MB | 277.34375KB |
| Ink-on-Rezi | 409µs | 44µs | 407µs–412µs | 2.4K ops/s | 410.25ms | 486.23ms | 17.03ms | 88.0MB | 20.0MB | 277.34375KB |
| Ink | 16.39ms | 16.07ms | 15.43ms–17.37ms | 61 ops/s | 16.39s | 403.96ms | 34.28ms | 102.4MB | 24.6MB | 68.4580078125KB |
| blessed | 126µs | 34µs | 124µs–128µs | 7.9K ops/s | 126.69ms | 147.40ms | 28.87ms | 70.7MB | 18.3MB | 16.7099609375KB |

## terminal-frame-fill (rows=40, cols=120, dirtyLines=1)

| Framework | Mean | Std dev | Mean CI95 | ops/s | Wall | CPU user | CPU sys | Peak RSS | Peak Heap | Bytes |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| ratatui | 197µs | 22µs | 195µs–199µs | 5.1K ops/s | 98.44ms | 96.23ms | 12.09ms | 4.9MB | n/a | 23.6181640625KB |
| Rezi (native) | 567µs | 56µs | 563µs–573µs | 1.8K ops/s | 284.31ms | 286.14ms | 35.55ms | 80.6MB | 22.4MB | 3.4MB |
| Ink-on-Rezi | 780µs | 89µs | 773µs–789µs | 1.3K ops/s | 390.43ms | 438.72ms | 17.73ms | 116.4MB | 32.9MB | 3.4MB |
| Ink | 17.73ms | 14.82ms | 16.52ms–19.03ms | 56 ops/s | 8.87s | 1.79s | 213.50ms | 112.6MB | 36.2MB | 284.5859375KB |
| blessed | 137µs | 53µs | 132µs–142µs | 7.3K ops/s | 68.90ms | 91.92ms | 8.24ms | 72.4MB | 16.9MB | 13.7890625KB |

## terminal-frame-fill (rows=40, cols=120, dirtyLines=40)

| Framework | Mean | Std dev | Mean CI95 | ops/s | Wall | CPU user | CPU sys | Peak RSS | Peak Heap | Bytes |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| ratatui | 211µs | 11µs | 210µs–212µs | 4.7K ops/s | 105.70ms | 100.38ms | 16.14ms | 4.8MB | n/a | 540.51171875KB |
| Rezi (native) | 610µs | 56µs | 605µs–616µs | 1.6K ops/s | 305.54ms | 328.70ms | 11.76ms | 81.3MB | 18.0MB | 3.4MB |
| Ink-on-Rezi | 832µs | 102µs | 824µs–842µs | 1.2K ops/s | 416.60ms | 427.76ms | 55.40ms | 112.3MB | 32.6MB | 3.4MB |
| Ink | 17.66ms | 14.78ms | 16.47ms–18.92ms | 57 ops/s | 8.83s | 1.92s | 155.53ms | 115.7MB | 41.8MB | 528.9609375KB |
| blessed | 256µs | 66µs | 251µs–262µs | 3.9K ops/s | 128.44ms | 138.99ms | 21.12ms | 73.9MB | 17.4MB | 543.587890625KB |

## terminal-virtual-list (items=100000, viewport=40)

| Framework | Mean | Std dev | Mean CI95 | ops/s | Wall | CPU user | CPU sys | Peak RSS | Peak Heap | Bytes |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| ratatui | 126µs | 9µs | 125µs–126µs | 8.0K ops/s | 125.63ms | 107.00ms | 31.18ms | 5.2MB | n/a | 1.3MB |
| Rezi (native) | 584µs | 138µs | 576µs–593µs | 1.7K ops/s | 585.34ms | 590.75ms | 72.10ms | 141.1MB | 65.4MB | 4.7MB |
| Ink-on-Rezi | 1.17ms | 203µs | 1.16ms–1.18ms | 853 ops/s | 1.17s | 1.26s | 72.45ms | 156.7MB | 70.8MB | 4.9MB |
| Ink | 18.88ms | 14.78ms | 18.11ms–19.77ms | 53 ops/s | 18.88s | 3.88s | 288.94ms | 136.5MB | 47.3MB | 1.9MB |
| blessed | 218µs | 51µs | 215µs–221µs | 4.6K ops/s | 218.89ms | 241.47ms | 27.64ms | 73.0MB | 17.1MB | 1.1MB |

## terminal-table (rows=40, cols=8)

| Framework | Mean | Std dev | Mean CI95 | ops/s | Wall | CPU user | CPU sys | Peak RSS | Peak Heap | Bytes |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| ratatui | 178µs | 10µs | 177µs–179µs | 5.6K ops/s | 89.01ms | 82.36ms | 15.78ms | 5.0MB | n/a | 27.5966796875KB |
| Rezi (native) | 493µs | 65µs | 488µs–500µs | 2.0K ops/s | 247.31ms | 266.68ms | 17.25ms | 79.9MB | 22.1MB | 2.7MB |
| Ink-on-Rezi | 697µs | 98µs | 689µs–706µs | 1.4K ops/s | 348.92ms | 387.77ms | 24.70ms | 115.7MB | 31.5MB | 2.7MB |
| Ink | 17.44ms | 15.08ms | 16.18ms–18.76ms | 57 ops/s | 8.72s | 1.55s | 120.94ms | 110.9MB | 30.3MB | 1.5MB |
| blessed | 188µs | 42µs | 185µs–192µs | 5.3K ops/s | 94.80ms | 106.70ms | 9.12ms | 71.7MB | 13.2MB | 20.302734375KB |

## Speedup Summary

| Scenario | Ink-on-Rezi vs Ink | Rezi native vs Ink |
|---|---:|---:|
| terminal-rerender | 40.1x | 50.8x |
| terminal-frame-fill (rows=40, cols=120, dirtyLines=1) | 22.7x | 31.2x |
| terminal-frame-fill (rows=40, cols=120, dirtyLines=40) | 21.2x | 28.9x |
| terminal-virtual-list (items=100000, viewport=40) | 16.1x | 32.3x |
| terminal-table (rows=40, cols=8) | 25.0x | 35.4x |

## Memory Comparison

| Scenario | Framework | Peak RSS | Peak Heap | RSS Growth | Heap Growth | RSS Slope | Stable |
|---|---|---:|---:|---:|---:|---:|---:|
| terminal-rerender | Rezi (native) | 66.4MB | 13.9MB | +5.1MB | +3.7MB | N/A | N/A |
| terminal-rerender | Ink-on-Rezi | 88.0MB | 20.0MB | +10.1MB | +8.7MB | N/A | N/A |
| terminal-rerender | Ink | 102.4MB | 24.6MB | +17.4MB | +10.2MB | N/A | N/A |
| terminal-rerender | blessed | 70.7MB | 18.3MB | +6.4MB | +4.7MB | N/A | N/A |
| terminal-rerender | ratatui | 4.8MB | n/a | +264KB | n/a | N/A | N/A |
| terminal-frame-fill (rows=40, cols=120, dirtyLines=1) | Rezi (native) | 80.6MB | 22.4MB | +17.4MB | +14.1MB | N/A | N/A |
| terminal-frame-fill (rows=40, cols=120, dirtyLines=1) | Ink-on-Rezi | 116.4MB | 32.9MB | +29.9MB | +21.3MB | N/A | N/A |
| terminal-frame-fill (rows=40, cols=120, dirtyLines=1) | Ink | 112.6MB | 36.2MB | +432KB | +22.4MB | N/A | N/A |
| terminal-frame-fill (rows=40, cols=120, dirtyLines=1) | blessed | 72.4MB | 16.9MB | +7.8MB | +420KB | N/A | N/A |
| terminal-frame-fill (rows=40, cols=120, dirtyLines=1) | ratatui | 4.9MB | n/a | +380KB | n/a | N/A | N/A |
| terminal-frame-fill (rows=40, cols=120, dirtyLines=40) | Rezi (native) | 81.3MB | 18.0MB | +18.5MB | +9.9MB | N/A | N/A |
| terminal-frame-fill (rows=40, cols=120, dirtyLines=40) | Ink-on-Rezi | 112.3MB | 32.6MB | +29.8MB | +16.4MB | N/A | N/A |
| terminal-frame-fill (rows=40, cols=120, dirtyLines=40) | Ink | 115.7MB | 41.8MB | +3.0MB | +21.5MB | N/A | N/A |
| terminal-frame-fill (rows=40, cols=120, dirtyLines=40) | blessed | 73.9MB | 17.4MB | +2.6MB | +6.6MB | N/A | N/A |
| terminal-frame-fill (rows=40, cols=120, dirtyLines=40) | ratatui | 4.8MB | n/a | +368KB | n/a | N/A | N/A |
| terminal-virtual-list (items=100000, viewport=40) | Rezi (native) | 141.1MB | 65.4MB | +52.4MB | +21.0MB | N/A | N/A |
| terminal-virtual-list (items=100000, viewport=40) | Ink-on-Rezi | 156.7MB | 70.8MB | +36.2MB | +13.4MB | N/A | N/A |
| terminal-virtual-list (items=100000, viewport=40) | Ink | 136.5MB | 47.3MB | -13.2MB | +10.6MB | N/A | N/A |
| terminal-virtual-list (items=100000, viewport=40) | blessed | 73.0MB | 17.1MB | -300KB | +2.3MB | N/A | N/A |
| terminal-virtual-list (items=100000, viewport=40) | ratatui | 5.2MB | n/a | +316KB | n/a | N/A | N/A |
| terminal-table (rows=40, cols=8) | Rezi (native) | 79.9MB | 22.1MB | +15.7MB | +11.7MB | N/A | N/A |
| terminal-table (rows=40, cols=8) | Ink-on-Rezi | 115.7MB | 31.5MB | +29.9MB | +15.1MB | N/A | N/A |
| terminal-table (rows=40, cols=8) | Ink | 110.9MB | 30.3MB | +3.7MB | +12.4MB | N/A | N/A |
| terminal-table (rows=40, cols=8) | blessed | 71.7MB | 13.2MB | +3.3MB | +2.4MB | N/A | N/A |
| terminal-table (rows=40, cols=8) | ratatui | 5.0MB | n/a | +316KB | n/a | N/A | N/A |
