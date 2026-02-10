# Progress

Progress bar widget for values normalized to `0..1`.

## Usage

```typescript
import { ui } from "@rezi-ui/core";

ui.progress(0.75);
ui.progress(0.5, { variant: "blocks", showPercent: true });
ui.progress(0.3, { label: "Downloading:", width: 20 });
```

## Props

`ui.progress(value, props?)` takes a required value plus optional props.

| Prop | Type | Default | Description |
|---|---|---|---|
| `value` | `number` | **required** | Progress value from `0` to `1` |
| `width` | `number` | - | Width in cells (default: fill available space) |
| `variant` | `"bar" \| "blocks" \| "minimal"` | `"bar"` | Visual style |
| `showPercent` | `boolean` | `false` | Show percentage text |
| `label` | `string` | - | Optional label before the bar |
| `style` | `TextStyle` | - | Style for the filled portion |
| `trackStyle` | `TextStyle` | - | Style for the track/unfilled portion |
| `key` | `string` | - | Reconciliation key |

## Examples

### 1) Deterministic progress from state

```typescript
import { ui } from "@rezi-ui/core";

ui.progress(state.done / state.total, { showPercent: true });
```

### 2) Styled track

```typescript
import { ui, rgb } from "@rezi-ui/core";

ui.progress(0.42, {
  width: 24,
  label: "Build",
  style: { fg: rgb(80, 220, 120) },
  trackStyle: { fg: rgb(80, 80, 80) },
});
```

## Notes

- Prefer progress values derived from state, not timers inside `view`.

## Related

- [Gauge](gauge.md) - Compact progress display
- [Spinner](spinner.md) - Indeterminate loading indicator
