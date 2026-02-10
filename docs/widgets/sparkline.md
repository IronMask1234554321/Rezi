# `Sparkline`

Tiny inline chart for showing trends.

## Usage

```ts
ui.sparkline(state.series, { width: 24, min: 0, max: 100 })
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `number[]` | **required** | Data points (normalized to 0–1) |
| `width` | `number` | `data.length` | Width in cells |
| `min` | `number` | auto | Minimum value for scaling |
| `max` | `number` | auto | Maximum value for scaling |
| `style` | `TextStyle` | - | Optional style override |

## Notes

- Use `min`/`max` to pin the scale when comparing multiple sparklines.
- For multi-series data, render multiple sparklines in a `row`.

## Related

- [Mini chart](mini-chart.md)
- [Bar chart](bar-chart.md)
