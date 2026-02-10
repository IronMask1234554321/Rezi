# Node backend

The Node backend owns:

- worker-thread engine ownership (native engine is never called on the main thread)
- frame scheduling and buffer pooling
- transfer of drawlists to the engine and event batches back to core

Most apps should construct a backend via:

```ts
import { createNodeBackend } from "@rezi-ui/node";
```

Next: [Worker model](worker-model.md).

