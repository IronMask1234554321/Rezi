# `ResizablePanel`

Panel used inside a `PanelGroup`.

## Usage

```ts
ui.panelGroup(
  { id: "main", direction: "horizontal" },
  [
    ui.resizablePanel({ defaultSize: 25, minSize: 20 }, [Sidebar()]),
    ui.resizablePanel({ defaultSize: 75 }, [Content()]),
  ]
)
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `defaultSize` | `number` | auto | Initial size (percent or cells, based on parent) |
| `minSize` | `number` | - | Minimum size |
| `maxSize` | `number` | - | Maximum size |
| `collapsible` | `boolean` | `false` | Allow collapsing the panel |

## Notes

- `ResizablePanel` should contain exactly one child widget.
- `PanelGroup` distributes space evenly; size hints on `ResizablePanel` are preserved as metadata but not applied by core layout.
- For draggable sizing, use [`SplitPane`](split-pane.md).
