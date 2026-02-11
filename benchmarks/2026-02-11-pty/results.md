# Benchmark Results

> 2026-02-11T11:37:20.602Z | Node v20.19.5 | Linux 6.6.87.2-microsoft-standard-WSL2 | linux x64 | AMD Ryzen 7 9800X3D 8-Core Processor (12 cores) | RAM 15993MB

> Invocation: scenario=all framework=all warmup=default iterations=default quick=no io=pty

## tree-construction (items=10)

| Framework | Mean | Std dev | Mean CI95 | ops/s | Wall | CPU user | CPU sys | Peak RSS | Peak Heap | Bytes |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Rezi (native) | 357µs | 54µs | 353µs–363µs | 2.8K ops/s | 179.24ms | 218.08ms | 7.85ms | 69.9MB | 16.8MB | 1.1MB |
| Ink-on-Rezi | 543µs | 80µs | 537µs–551µs | 1.8K ops/s | 271.97ms | 322.17ms | 24.70ms | 94.4MB | 27.0MB | 1.1MB |
| Ink | 17.07ms | 15.72ms | 15.74ms–18.44ms | 59 ops/s | 8.53s | 479.45ms | 34.94ms | 112.3MB | 31.6MB | 355.9091796875KB |

## tree-construction (items=100)

| Framework | Mean | Std dev | Mean CI95 | ops/s | Wall | CPU user | CPU sys | Peak RSS | Peak Heap | Bytes |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Rezi (native) | 502µs | 123µs | 493µs–515µs | 2.0K ops/s | 251.69ms | 265.11ms | 20.15ms | 110.1MB | 44.0MB | 1.8MB |
| Ink-on-Rezi | 1.45ms | 190µs | 1.43ms–1.46ms | 691 ops/s | 723.42ms | 760.37ms | 40.25ms | 153.3MB | 75.7MB | 1.9MB |
| Ink | 20.17ms | 14.05ms | 18.99ms–21.42ms | 50 ops/s | 10.09s | 3.00s | 316.21ms | 146.9MB | 57.8MB | 2.0MB |

## tree-construction (items=500)

| Framework | Mean | Std dev | Mean CI95 | ops/s | Wall | CPU user | CPU sys | Peak RSS | Peak Heap | Bytes |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Rezi (native) | 1.03ms | 255µs | 1.01ms–1.05ms | 972 ops/s | 514.44ms | 568.40ms | 43.64ms | 143.1MB | 67.1MB | 1.8MB |
| Ink-on-Rezi | 5.74ms | 669µs | 5.69ms–5.81ms | 174 ops/s | 2.87s | 3.28s | 143.81ms | 194.1MB | 92.7MB | 1.9MB |
| Ink | 32.41ms | 9.09ms | 31.61ms–33.33ms | 31 ops/s | 16.21s | 15.40s | 1.78s | 241.3MB | 156.3MB | 10.0MB |

## tree-construction (items=1000)

| Framework | Mean | Std dev | Mean CI95 | ops/s | Wall | CPU user | CPU sys | Peak RSS | Peak Heap | Bytes |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Rezi (native) | 1.81ms | 533µs | 1.76ms–1.86ms | 553 ops/s | 904.76ms | 1.14s | 109.28ms | 159.0MB | 79.6MB | 1.8MB |
| Ink-on-Rezi | 11.27ms | 1.04ms | 11.19ms–11.38ms | 89 ops/s | 5.64s | 6.50s | 343.78ms | 235.8MB | 53.3MB | 1.9MB |
| Ink | 53.15ms | 6.78ms | 52.57ms–53.77ms | 19 ops/s | 26.58s | 31.06s | 2.64s | 335.6MB | 230.0MB | 20.0MB |

## rerender

| Framework | Mean | Std dev | Mean CI95 | ops/s | Wall | CPU user | CPU sys | Peak RSS | Peak Heap | Bytes |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Rezi (native) | 353µs | 36µs | 351µs–356µs | 2.8K ops/s | 354.46ms | 405.00ms | 16.41ms | 77.9MB | 19.2MB | 902.73828125KB |
| Ink-on-Rezi | 414µs | 49µs | 411µs–417µs | 2.4K ops/s | 414.75ms | 468.87ms | 54.72ms | 89.7MB | 23.5MB | 507.8125KB |
| Ink | 16.52ms | 16.04ms | 15.58ms–17.49ms | 61 ops/s | 16.52s | 445.52ms | 85.09ms | 105.9MB | 29.3MB | 135.939453125KB |

## layout-stress (rows=40, cols=4)

| Framework | Mean | Std dev | Mean CI95 | ops/s | Wall | CPU user | CPU sys | Peak RSS | Peak Heap | Bytes |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Rezi (native) | 1.59ms | 322µs | 1.56ms–1.63ms | 629 ops/s | 476.76ms | 520.18ms | 41.55ms | 137.3MB | 66.2MB | 4.0MB |
| Ink-on-Rezi | 2.50ms | 300µs | 2.47ms–2.53ms | 400 ops/s | 750.07ms | 801.99ms | 57.88ms | 147.5MB | 55.6MB | 2.2MB |
| Ink | 21.04ms | 13.83ms | 19.52ms–22.66ms | 48 ops/s | 6.31s | 2.01s | 172.18ms | 146.6MB | 43.9MB | 2.7MB |

## scroll-stress (items=2000)

| Framework | Mean | Std dev | Mean CI95 | ops/s | Wall | CPU user | CPU sys | Peak RSS | Peak Heap | Bytes |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Rezi (native) | 11.78ms | 3.01ms | 11.01ms–12.62ms | 85 ops/s | 588.86ms | 751.26ms | 185.98ms | 205.6MB | 134.8MB | 235.2109375KB |
| Ink-on-Rezi | 44.50ms | 7.85ms | 42.52ms–46.71ms | 22 ops/s | 2.23s | 2.69s | 275.00ms | 246.0MB | 109.7MB | 248.17578125KB |
| Ink | 144.86ms | 16.79ms | 140.49ms–149.46ms | 7 ops/s | 7.24s | 8.09s | 1.06s | 553.3MB | 448.5MB | 4.1MB |

## virtual-list (items=100000, viewport=40)

| Framework | Mean | Std dev | Mean CI95 | ops/s | Wall | CPU user | CPU sys | Peak RSS | Peak Heap | Bytes |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Rezi (native) | 573µs | 135µs | 565µs–582µs | 1.7K ops/s | 573.91ms | 583.81ms | 68.50ms | 134.9MB | 57.4MB | 4.6MB |
| Ink-on-Rezi | 1.13ms | 210µs | 1.12ms–1.14ms | 886 ops/s | 1.13s | 1.23s | 54.05ms | 151.2MB | 73.4MB | 4.9MB |
| Ink | 19.23ms | 14.78ms | 18.41ms–20.14ms | 52 ops/s | 19.23s | 3.99s | 303.96ms | 127.2MB | 43.2MB | 1.8MB |

## tables (rows=100, cols=8)

| Framework | Mean | Std dev | Mean CI95 | ops/s | Wall | CPU user | CPU sys | Peak RSS | Peak Heap | Bytes |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Rezi (native) | 2.36ms | 847µs | 2.27ms–2.46ms | 423 ops/s | 709.78ms | 746.67ms | 37.87ms | 134.2MB | 66.5MB | 2.8MB |
| Ink-on-Rezi | 5.55ms | 972µs | 5.44ms–5.66ms | 180 ops/s | 1.67s | 1.89s | 66.56ms | 154.3MB | 41.7MB | 3.1MB |
| Ink | 24.26ms | 11.65ms | 22.95ms–25.64ms | 41 ops/s | 7.28s | 4.53s | 460.32ms | 162.6MB | 67.6MB | 3.1MB |

## memory-profile

| Framework | Mean | Std dev | Mean CI95 | ops/s | Wall | CPU user | CPU sys | Peak RSS | Peak Heap | Bytes |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Rezi (native) | 468µs | 75µs | 465µs–471µs | 2.1K ops/s | 938.17ms | 1.07s | 44.32ms | 108.2MB | 39.3MB | 4.8MB |
| Ink-on-Rezi | 560µs | 99µs | 555µs–564µs | 1.8K ops/s | 1.12s | 1.23s | 87.70ms | 122.4MB | 46.6MB | 3.7MB |
| Ink | 17.20ms | 15.68ms | 16.60ms–17.89ms | 58 ops/s | 34.41s | 2.13s | 255.62ms | 114.3MB | 35.7MB | 1.5MB |

## Speedup Summary

| Scenario | Ink-on-Rezi vs Ink | Rezi native vs Ink |
|---|---:|---:|
| tree-construction (items=10) | 31.4x | 47.8x |
| tree-construction (items=100) | 14.0x | 40.2x |
| tree-construction (items=500) | 5.6x | 31.5x |
| tree-construction (items=1000) | 4.7x | 29.4x |
| rerender | 39.9x | 46.8x |
| layout-stress (rows=40, cols=4) | 8.4x | 13.3x |
| scroll-stress (items=2000) | 3.3x | 12.3x |
| virtual-list (items=100000, viewport=40) | 17.1x | 33.6x |
| tables (rows=100, cols=8) | 4.4x | 10.3x |
| memory-profile | 30.7x | 36.8x |

## Memory Comparison

| Scenario | Framework | Peak RSS | Peak Heap | RSS Growth | Heap Growth | RSS Slope | Stable |
|---|---|---:|---:|---:|---:|---:|---:|
| tree-construction (items=10) | Rezi (native) | 69.9MB | 16.8MB | +6.1MB | +8.6MB | N/A | N/A |
| tree-construction (items=10) | Ink-on-Rezi | 94.4MB | 27.0MB | +13.3MB | +15.4MB | N/A | N/A |
| tree-construction (items=10) | Ink | 112.3MB | 31.6MB | +13.1MB | +13.5MB | N/A | N/A |
| tree-construction (items=100) | Rezi (native) | 110.1MB | 44.0MB | +37.1MB | +15.1MB | N/A | N/A |
| tree-construction (items=100) | Ink-on-Rezi | 153.3MB | 75.7MB | +34.2MB | +9.5MB | N/A | N/A |
| tree-construction (items=100) | Ink | 146.9MB | 57.8MB | +17.0MB | +16.7MB | N/A | N/A |
| tree-construction (items=500) | Rezi (native) | 143.1MB | 67.1MB | +17.0MB | +35.7MB | N/A | N/A |
| tree-construction (items=500) | Ink-on-Rezi | 194.1MB | 92.7MB | +29.7MB | +49.3MB | N/A | N/A |
| tree-construction (items=500) | Ink | 241.3MB | 156.3MB | -2.0MB | +38.2MB | N/A | N/A |
| tree-construction (items=1000) | Rezi (native) | 159.0MB | 79.6MB | +37.4MB | +21.2MB | N/A | N/A |
| tree-construction (items=1000) | Ink-on-Rezi | 235.8MB | 53.3MB | +53.2MB | +13.1MB | N/A | N/A |
| tree-construction (items=1000) | Ink | 335.6MB | 230.0MB | +16.8MB | +69.5MB | N/A | N/A |
| rerender | Rezi (native) | 77.9MB | 19.2MB | +15.9MB | +11.0MB | N/A | N/A |
| rerender | Ink-on-Rezi | 89.7MB | 23.5MB | +11.5MB | +12.3MB | N/A | N/A |
| rerender | Ink | 105.9MB | 29.3MB | +19.8MB | +3.7MB | N/A | N/A |
| layout-stress (rows=40, cols=4) | Rezi (native) | 137.3MB | 66.2MB | +19.4MB | +30.6MB | N/A | N/A |
| layout-stress (rows=40, cols=4) | Ink-on-Rezi | 147.5MB | 55.6MB | +27.7MB | +41.1MB | N/A | N/A |
| layout-stress (rows=40, cols=4) | Ink | 146.6MB | 43.9MB | +15.3MB | +29.5MB | N/A | N/A |
| scroll-stress (items=2000) | Rezi (native) | 205.6MB | 134.8MB | +30.3MB | +114.2MB | N/A | N/A |
| scroll-stress (items=2000) | Ink-on-Rezi | 246.0MB | 109.7MB | +47.1MB | +56.3MB | N/A | N/A |
| scroll-stress (items=2000) | Ink | 553.3MB | 448.5MB | +273.4MB | +396.4MB | N/A | N/A |
| virtual-list (items=100000, viewport=40) | Rezi (native) | 134.9MB | 57.4MB | +52.2MB | +18.9MB | N/A | N/A |
| virtual-list (items=100000, viewport=40) | Ink-on-Rezi | 151.2MB | 73.4MB | +34.9MB | +17.7MB | N/A | N/A |
| virtual-list (items=100000, viewport=40) | Ink | 127.2MB | 43.2MB | -7.2MB | +30.2MB | N/A | N/A |
| tables (rows=100, cols=8) | Rezi (native) | 134.2MB | 66.5MB | +33.3MB | +55.7MB | N/A | N/A |
| tables (rows=100, cols=8) | Ink-on-Rezi | 154.3MB | 41.7MB | +10.8MB | +23.8MB | N/A | N/A |
| tables (rows=100, cols=8) | Ink | 162.6MB | 67.6MB | +19.1MB | +26.5MB | N/A | N/A |
| memory-profile | Rezi (native) | 108.2MB | 39.3MB | +44.7MB | +22.4MB | 21.7274 KB/iter | no |
| memory-profile | Ink-on-Rezi | 122.4MB | 46.6MB | +42.6MB | +32.2MB | 19.7854 KB/iter | no |
| memory-profile | Ink | 114.3MB | 35.7MB | +11.3MB | +10.5MB | 3.5851 KB/iter | no |
