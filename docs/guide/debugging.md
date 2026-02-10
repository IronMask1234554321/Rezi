# Debugging

Rezi includes a debug trace system for diagnosing rendering, events, and performance issues.

## Debug Controller

Create a debug controller to capture and analyze runtime behavior:

```typescript
import { createDebugController, categoriesToMask } from "@rezi-ui/core";

const debug = createDebugController({ maxFrames: 1000 });

// Enable tracing with specific categories
await debug.enable({
  minSeverity: "info",
  categoryMask: categoriesToMask(["frame", "error", "perf"]),
});

// Subscribe to errors
debug.on("error", (err) => console.error(err.message));

// Subscribe to all records
debug.on("record", (record) => {
  if (record.category === "perf") {
    console.log(`${record.phase}: ${record.durationMs}ms`);
  }
});
```

## Debug Categories

| Category | Description |
|----------|-------------|
| `frame` | Frame lifecycle events (begin, end, metrics) |
| `event` | Input event flow and routing |
| `drawlist` | Drawlist building and rendering |
| `error` | Error events and failures |
| `state` | Application state changes |
| `perf` | Performance timing and phases |

Enable multiple categories:

```typescript
const mask = categoriesToMask(["frame", "event", "perf"]);
```

## Debug Severities

| Severity | Usage |
|----------|-------|
| `trace` | Verbose internal details |
| `info` | Normal operational events |
| `warn` | Potential issues |
| `error` | Failures and errors |

Filter by minimum severity:

```typescript
await debug.enable({ minSeverity: "warn" });
```

## Frame Inspector

Analyze frame metrics and compare frames:

```typescript
const inspector = debug.frameInspector;

// Get recent frame snapshots
const frames = inspector.getSnapshots(10);
for (const frame of frames) {
  console.log(`Frame ${frame.frameId}: ${frame.renderMs}ms render, ${frame.drawCommands} commands`);
}

// Compare two frames for changes
const diff = inspector.compareFrames(frameA, frameB);
for (const change of diff.changes) {
  console.log(`${change.field}: ${change.oldValue} -> ${change.newValue}`);
}
```

Frame snapshots include:

- Frame ID and timestamp
- Render duration
- Draw command count
- Widget tree depth
- Visible widget count

## Event Trace

Track input events through the system:

```typescript
const trace = debug.eventTrace;

// Query recent events
const keyEvents = trace.query({
  eventTypes: ["key"],
  since: Date.now() - 5000,
  limit: 100,
});

for (const ev of keyEvents) {
  console.log(`Key: ${ev.key} at ${ev.timestamp}`);
}
```

## Error Aggregator

Collect and deduplicate errors:

```typescript
const errors = debug.errors;

// Get all unique errors
const all = errors.all();
for (const err of all) {
  console.log(`${err.code}: ${err.message} (${err.count} occurrences)`);
}

// Get error count
console.log(`Total error types: ${errors.size()}`);

// Clear errors
errors.clear();
```

## State Timeline

Track application state changes:

```typescript
const timeline = debug.stateTimeline;

// Get state history
const history = timeline.getHistory(20);
for (const entry of history) {
  console.log(`State change at ${entry.timestamp}`);
  for (const change of entry.changes) {
    console.log(`  ${change.path}: ${change.from} -> ${change.to}`);
  }
}
```

## Debug Panel Widget

Display debug information in your UI:

```typescript
import { debugPanel, fpsCounter, errorBadge } from "@rezi-ui/core";

app.view((state) =>
  ui.column({}, [
    // Your app content...

    // Debug panel in corner
    debugPanel({
      debug,
      position: "bottom-right",
    }),

    // Or individual components
    fpsCounter({ debug }),
    errorBadge({ debug }),
  ])
);
```

## Performance Instrumentation

Track specific phases of your application:

```typescript
import { perfMarkStart, perfMarkEnd, perfSnapshot } from "@rezi-ui/core";

// Mark a phase
const token = perfMarkStart("data-fetch");
await fetchData();
perfMarkEnd(token);

// Get performance snapshot
const snapshot = perfSnapshot();
console.log(`Data fetch: avg ${snapshot.phases["data-fetch"].avgMs}ms`);
```

## Debug Configuration

Configure debug behavior at creation:

```typescript
const debug = createDebugController({
  maxFrames: 500,     // Frame history limit
  maxEvents: 1000,    // Event trace limit
  maxErrors: 100,     // Error aggregation limit
});
```

## Debugging Tips

**Reproduce deterministically**
: Rezi's deterministic design means the same input sequence produces the same behavior. Capture and replay event sequences to reproduce issues.

**Start with minimal examples**
: The `examples/` directory contains minimal applications. Start there to isolate issues.

**Check error aggregation**
: Many issues surface through the error aggregator. Check `debug.errors.all()` first.

**Compare frames**
: For visual glitches, compare frame snapshots to find what changed.

**Profile render phases**
: Use the perf category to identify slow render phases.

## Related

- [Performance](performance.md) - Optimization techniques
- [Node backend](../backend/node.md) - Runtime backend behavior
