# `MiniChart`

Compact multi-value display (bars or pills).

## Usage

```ts
ui.miniChart([
  { label: "CPU", value: 62, max: 100 },
  { label: "RAM", value: 41, max: 100 },
], { variant: "pills" })
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `values` | `{ label: string; value: number; max?: number }[]` | **required** | Labeled values to render |
| `variant` | `"bars" \| "pills"` | `"bars"` | Visual variant |
| `style` | `TextStyle` | - | Optional style override |

## Notes

- When `max` is omitted, each value uses its own value as the max (renders as full scale).
  Provide `max` to show relative utilization.

## Related

- [Sparkline](sparkline.md)
- [Bar chart](bar-chart.md)
