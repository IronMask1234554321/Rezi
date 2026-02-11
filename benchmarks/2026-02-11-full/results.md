# Benchmark Results

> 2026-02-11T11:22:15.362Z | Node v20.19.5 | Linux 6.6.87.2-microsoft-standard-WSL2 | linux x64 | AMD Ryzen 7 9800X3D 8-Core Processor (12 cores) | RAM 15993MB

> Invocation: scenario=all framework=all warmup=default iterations=default quick=no io=stub

## tree-construction (items=10)

| Framework | Mean | Std dev | Mean CI95 | ops/s | Wall | CPU user | CPU sys | Peak RSS | Peak Heap | Bytes |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Rezi (native) | 56µs | 63µs | 51µs–62µs | 17.7K ops/s | 28.29ms | 71.10ms | 6.68ms | 68.4MB | 16.8MB | 1.1MB |
| Ink-on-Rezi | 228µs | 101µs | 220µs–237µs | 4.4K ops/s | 114.15ms | 169.52ms | 25.72ms | 89.4MB | 26.8MB | 1.1MB |
| Ink | 17.44ms | 15.76ms | 16.17ms–18.82ms | 57 ops/s | 8.72s | 479.69ms | 30.85ms | 110.0MB | 31.2MB | 263.6240234375KB |

## tree-construction (items=100)

| Framework | Mean | Std dev | Mean CI95 | ops/s | Wall | CPU user | CPU sys | Peak RSS | Peak Heap | Bytes |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Rezi (native) | 194µs | 128µs | 185µs–207µs | 5.1K ops/s | 97.58ms | 112.44ms | 13.80ms | 118.3MB | 49.3MB | 1.8MB |
| Ink-on-Rezi | 1.15ms | 205µs | 1.13ms–1.17ms | 871 ops/s | 574.30ms | 622.45ms | 32.83ms | 149.7MB | 76.0MB | 1.9MB |
| Ink | 19.69ms | 14.00ms | 18.53ms–20.93ms | 51 ops/s | 9.84s | 3.10s | 204.06ms | 148.4MB | 68.7MB | 1.1MB |

## tree-construction (items=500)

| Framework | Mean | Std dev | Mean CI95 | ops/s | Wall | CPU user | CPU sys | Peak RSS | Peak Heap | Bytes |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Rezi (native) | 780µs | 285µs | 758µs–808µs | 1.3K ops/s | 390.63ms | 464.19ms | 29.74ms | 141.9MB | 65.7MB | 1.8MB |
| Ink-on-Rezi | 5.50ms | 694µs | 5.44ms–5.57ms | 182 ops/s | 2.75s | 3.25s | 144.40ms | 192.0MB | 102.6MB | 1.9MB |
| Ink | 33.31ms | 10.36ms | 32.43ms–34.21ms | 30 ops/s | 16.66s | 15.75s | 1.52s | 226.9MB | 143.5MB | 5.7MB |

## tree-construction (items=1000)

| Framework | Mean | Std dev | Mean CI95 | ops/s | Wall | CPU user | CPU sys | Peak RSS | Peak Heap | Bytes |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Rezi (native) | 1.47ms | 436µs | 1.43ms–1.51ms | 682 ops/s | 733.18ms | 896.34ms | 82.94ms | 144.3MB | 67.8MB | 1.8MB |
| Ink-on-Rezi | 10.90ms | 1.10ms | 10.82ms–11.02ms | 92 ops/s | 5.45s | 6.31s | 328.58ms | 226.1MB | 51.1MB | 1.9MB |
| Ink | 50.45ms | 6.49ms | 49.89ms–51.06ms | 20 ops/s | 25.23s | 29.61s | 2.32s | 330.3MB | 201.3MB | 11.4MB |

## rerender

| Framework | Mean | Std dev | Mean CI95 | ops/s | Wall | CPU user | CPU sys | Peak RSS | Peak Heap | Bytes |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Rezi (native) | 34µs | 39µs | 32µs–37µs | 28.9K ops/s | 34.57ms | 82.81ms | 9.57ms | 70.3MB | 18.7MB | 902.73828125KB |
| Ink-on-Rezi | 86µs | 61µs | 83µs–90µs | 11.5K ops/s | 86.63ms | 189.46ms | 3.57ms | 86.1MB | 23.1MB | 507.8125KB |
| Ink | 16.37ms | 16.06ms | 15.41ms–17.35ms | 61 ops/s | 16.37s | 381.36ms | 55.57ms | 104.4MB | 30.8MB | 118.361328125KB |

## layout-stress (rows=40, cols=4)

| Framework | Mean | Std dev | Mean CI95 | ops/s | Wall | CPU user | CPU sys | Peak RSS | Peak Heap | Bytes |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Rezi (native) | 1.15ms | 308µs | 1.12ms–1.19ms | 866 ops/s | 346.53ms | 388.83ms | 31.02ms | 134.3MB | 55.6MB | 4.0MB |
| Ink-on-Rezi | 2.21ms | 334µs | 2.18ms–2.25ms | 451 ops/s | 664.65ms | 696.13ms | 83.97ms | 142.5MB | 58.9MB | 2.2MB |
| Ink | 20.10ms | 13.83ms | 18.56ms–21.66ms | 50 ops/s | 6.03s | 1.96s | 134.80ms | 140.6MB | 55.5MB | 2.2MB |

## scroll-stress (items=2000)

| Framework | Mean | Std dev | Mean CI95 | ops/s | Wall | CPU user | CPU sys | Peak RSS | Peak Heap | Bytes |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Rezi (native) | 10.72ms | 2.83ms | 10.01ms–11.52ms | 93 ops/s | 536.01ms | 677.27ms | 189.08ms | 172.0MB | 82.2MB | 235.2109375KB |
| Ink-on-Rezi | 39.89ms | 4.93ms | 38.67ms–41.36ms | 25 ops/s | 1.99s | 2.42s | 291.35ms | 245.6MB | 93.9MB | 248.17578125KB |
| Ink | 133.37ms | 13.10ms | 129.98ms–136.93ms | 7 ops/s | 6.67s | 7.42s | 995.17ms | 346.4MB | 179.7MB | 2.4MB |

## virtual-list (items=100000, viewport=40)

| Framework | Mean | Std dev | Mean CI95 | ops/s | Wall | CPU user | CPU sys | Peak RSS | Peak Heap | Bytes |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Rezi (native) | 214µs | 133µs | 207µs–223µs | 4.6K ops/s | 215.07ms | 257.55ms | 29.18ms | 131.8MB | 55.6MB | 4.6MB |
| Ink-on-Rezi | 752µs | 190µs | 741µs–764µs | 1.3K ops/s | 752.47ms | 871.16ms | 33.67ms | 156.7MB | 78.6MB | 4.9MB |
| Ink | 18.37ms | 15.00ms | 17.58ms–19.27ms | 54 ops/s | 18.37s | 3.65s | 292.85ms | 120.5MB | 42.8MB | 1.1MB |

## tables (rows=100, cols=8)

| Framework | Mean | Std dev | Mean CI95 | ops/s | Wall | CPU user | CPU sys | Peak RSS | Peak Heap | Bytes |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Rezi (native) | 2.00ms | 835µs | 1.90ms–2.10ms | 500 ops/s | 600.02ms | 620.98ms | 44.59ms | 133.6MB | 67.5MB | 2.8MB |
| Ink-on-Rezi | 5.10ms | 937µs | 4.99ms–5.21ms | 196 ops/s | 1.53s | 1.74s | 83.90ms | 147.5MB | 37.7MB | 3.1MB |
| Ink | 22.88ms | 11.27ms | 21.69ms–24.22ms | 44 ops/s | 6.86s | 4.20s | 517.38ms | 161.2MB | 73.3MB | 1.8MB |

## memory-profile

| Framework | Mean | Std dev | Mean CI95 | ops/s | Wall | CPU user | CPU sys | Peak RSS | Peak Heap | Bytes |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Rezi (native) | 123µs | 82µs | 119µs–127µs | 8.1K ops/s | 246.96ms | 396.90ms | 19.54ms | 116.0MB | 50.4MB | 4.8MB |
| Ink-on-Rezi | 197µs | 93µs | 193µs–201µs | 5.1K ops/s | 395.40ms | 549.93ms | 33.52ms | 122.0MB | 49.0MB | 3.7MB |
| Ink | 17.21ms | 15.77ms | 16.60ms–17.90ms | 58 ops/s | 34.41s | 2.00s | 146.88ms | 114.4MB | 33.9MB | 1.3MB |

## Speedup Summary

| Scenario | Ink-on-Rezi vs Ink | Rezi native vs Ink |
|---|---:|---:|
| tree-construction (items=10) | 76.6x | 311.1x |
| tree-construction (items=100) | 17.2x | 101.2x |
| tree-construction (items=500) | 6.1x | 42.7x |
| tree-construction (items=1000) | 4.6x | 34.4x |
| rerender | 190.0x | 481.7x |
| layout-stress (rows=40, cols=4) | 9.1x | 17.4x |
| scroll-stress (items=2000) | 3.3x | 12.4x |
| virtual-list (items=100000, viewport=40) | 24.4x | 85.7x |
| tables (rows=100, cols=8) | 4.5x | 11.4x |
| memory-profile | 87.3x | 140.1x |

## Memory Comparison

| Scenario | Framework | Peak RSS | Peak Heap | RSS Growth | Heap Growth | RSS Slope | Stable |
|---|---|---:|---:|---:|---:|---:|---:|
| tree-construction (items=10) | Rezi (native) | 68.4MB | 16.8MB | +7.9MB | +8.9MB | N/A | N/A |
| tree-construction (items=10) | Ink-on-Rezi | 89.4MB | 26.8MB | +13.3MB | +15.3MB | N/A | N/A |
| tree-construction (items=10) | Ink | 110.0MB | 31.2MB | +22.9MB | +11.1MB | N/A | N/A |
| tree-construction (items=100) | Rezi (native) | 118.3MB | 49.3MB | +48.5MB | +40.6MB | N/A | N/A |
| tree-construction (items=100) | Ink-on-Rezi | 149.7MB | 76.0MB | +32.7MB | +11.0MB | N/A | N/A |
| tree-construction (items=100) | Ink | 148.4MB | 68.7MB | +17.5MB | +25.3MB | N/A | N/A |
| tree-construction (items=500) | Rezi (native) | 141.9MB | 65.7MB | +17.6MB | +34.8MB | N/A | N/A |
| tree-construction (items=500) | Ink-on-Rezi | 192.0MB | 102.6MB | +13.9MB | +55.4MB | N/A | N/A |
| tree-construction (items=500) | Ink | 226.9MB | 143.5MB | +34.8MB | +54.6MB | N/A | N/A |
| tree-construction (items=1000) | Rezi (native) | 144.3MB | 67.8MB | +31.0MB | +10.6MB | N/A | N/A |
| tree-construction (items=1000) | Ink-on-Rezi | 226.1MB | 51.1MB | +45.6MB | +20.3MB | N/A | N/A |
| tree-construction (items=1000) | Ink | 330.3MB | 201.3MB | +110.8MB | +33.2MB | N/A | N/A |
| rerender | Rezi (native) | 70.3MB | 18.7MB | +11.7MB | +10.9MB | N/A | N/A |
| rerender | Ink-on-Rezi | 86.1MB | 23.1MB | +14.3MB | +12.1MB | N/A | N/A |
| rerender | Ink | 104.4MB | 30.8MB | +20.9MB | +12.5MB | N/A | N/A |
| layout-stress (rows=40, cols=4) | Rezi (native) | 134.3MB | 55.6MB | +22.6MB | +24.4MB | N/A | N/A |
| layout-stress (rows=40, cols=4) | Ink-on-Rezi | 142.5MB | 58.9MB | +25.9MB | +44.5MB | N/A | N/A |
| layout-stress (rows=40, cols=4) | Ink | 140.6MB | 55.5MB | +11.1MB | +41.1MB | N/A | N/A |
| scroll-stress (items=2000) | Rezi (native) | 172.0MB | 82.2MB | +36.6MB | +61.9MB | N/A | N/A |
| scroll-stress (items=2000) | Ink-on-Rezi | 245.6MB | 93.9MB | +49.3MB | +40.7MB | N/A | N/A |
| scroll-stress (items=2000) | Ink | 346.4MB | 179.7MB | -52.4MB | +127.9MB | N/A | N/A |
| virtual-list (items=100000, viewport=40) | Rezi (native) | 131.8MB | 55.6MB | +51.3MB | +11.0MB | N/A | N/A |
| virtual-list (items=100000, viewport=40) | Ink-on-Rezi | 156.7MB | 78.6MB | +45.5MB | +29.6MB | N/A | N/A |
| virtual-list (items=100000, viewport=40) | Ink | 120.5MB | 42.8MB | -3.1MB | +17.7MB | N/A | N/A |
| tables (rows=100, cols=8) | Rezi (native) | 133.6MB | 67.5MB | +35.3MB | +57.1MB | N/A | N/A |
| tables (rows=100, cols=8) | Ink-on-Rezi | 147.5MB | 37.7MB | +15.6MB | +17.9MB | N/A | N/A |
| tables (rows=100, cols=8) | Ink | 161.2MB | 73.3MB | +19.9MB | +36.0MB | N/A | N/A |
| memory-profile | Rezi (native) | 116.0MB | 50.4MB | +51.7MB | +14.2MB | 29.7110 KB/iter | no |
| memory-profile | Ink-on-Rezi | 122.0MB | 49.0MB | +44.0MB | +20.6MB | 20.3321 KB/iter | no |
| memory-profile | Ink | 114.4MB | 33.9MB | +10.3MB | +22.0MB | 3.6028 KB/iter | no |
