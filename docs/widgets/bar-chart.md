# `BarChart`

Bar chart widget for categorical data.

## Usage

```ts
ui.barChart([
  { label: "A", value: 12 },
  { label: "B", value: 5 },
  { label: "C", value: 18 },
], { orientation: "horizontal", showValues: true })
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `{ label: string; value: number; variant?: BadgeVariant }[]` | **required** | Data items to render |
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | Chart orientation |
| `showValues` | `boolean` | `true` | Render numeric values |
| `showLabels` | `boolean` | `true` | Render labels |
| `maxBarLength` | `number` | auto | Max bar length in cells |
| `style` | `TextStyle` | - | Optional style override |

`BadgeVariant` values: `"default"`, `"success"`, `"warning"`, `"error"`, `"info"`.

## Related

- [Mini chart](mini-chart.md)
- [Sparkline](sparkline.md)
