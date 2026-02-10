# Gauge

Compact progress display with an optional label and semantic thresholds.

## Usage

```typescript
import { ui } from "@rezi-ui/core";

ui.gauge(0.62, { label: "CPU", variant: "compact" });
```

## Props

`ui.gauge(value, props?)` takes a required value (`0..1`) plus optional props.

| Prop | Type | Default | Description |
|---|---|---|---|
| `value` | `number` | **required** | Value from `0` to `1` |
| `label` | `string` | - | Optional label before the gauge |
| `variant` | `"linear" \| "compact"` | `"linear"` | Display variant |
| `thresholds` | `{ value: number; variant: BadgeVariant }[]` | - | Variant thresholds |
| `style` | `TextStyle` | - | Optional style override |
| `key` | `string` | - | Reconciliation key |

## Examples

### 1) With thresholds

```typescript
import { ui } from "@rezi-ui/core";

ui.gauge(state.cpu, {
  label: "CPU",
  thresholds: [
    { value: 0.8, variant: "warning" },
    { value: 0.95, variant: "error" },
  ],
});
```

### 2) Multiple gauges

```typescript
import { ui } from "@rezi-ui/core";

ui.column({ gap: 1 }, [
  ui.gauge(state.cpu, { label: "CPU" }),
  ui.gauge(state.mem, { label: "MEM" }),
]);
```

## Related

- [Progress](progress.md) - Full-width progress bars
- [Badge](badge.md) - Semantic variants used by thresholds
