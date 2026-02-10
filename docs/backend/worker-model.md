# Worker model

Rezi keeps the native engine on a worker thread.

High-level goals:

- never block the Node main thread on IO or polling
- deterministic backpressure when the app cannot keep up
- avoid unbounded queue growth

Related:

- [Node backend](node.md)
- [Native addon](native.md)
- [Event batches (ZREV)](../protocol/zrev.md)
