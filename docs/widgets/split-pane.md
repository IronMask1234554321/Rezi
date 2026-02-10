# `SplitPane`

A resizable split view container with a draggable divider.

## Usage

```ts
ui.splitPane(
  {
    id: "main-split",
    direction: "horizontal",
    sizes: state.panelSizes,
    minSizes: [20, 30, 20],
    dividerSize: 1,
    onResize: (sizes) => app.update((s) => ({ ...s, panelSizes: sizes })),
  },
  [FileExplorer(), Editor(), LogsPanel()]
)
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `id` | `string` | **required** | Split identifier |
| `direction` | `"horizontal" \| "vertical"` | **required** | Layout direction |
| `sizes` | `number[]` | **required** | Panel sizes (percent or cells) |
| `sizeMode` | `"percent" \| "absolute"` | `"percent"` | Size interpretation |
| `minSizes` | `number[]` | - | Per-panel minimums |
| `maxSizes` | `number[]` | - | Per-panel maximums |
| `dividerSize` | `number` | `1` | Divider width/height in cells |
| `collapsible` | `boolean` | `false` | Allow collapsing panels |
| `collapsed` | `number[]` | - | Collapsed panel indices |
| `onResize` | `(sizes) => void` | **required** | Resize callback |
| `onCollapse` | `(index, collapsed) => void` | - | Collapse callback |

## Notes

- `sizes` length should match the number of child panels.
- Use [`PanelGroup`](panel-group.md) for equal distribution without drag handles.

## Related

- [Panel group](panel-group.md)
- [Resizable panel](resizable-panel.md)
