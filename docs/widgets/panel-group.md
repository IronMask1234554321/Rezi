# `PanelGroup`

Container for resizable panels (equal distribution by default).

## Usage

```ts
ui.panelGroup(
  {
    id: "panel-group",
    direction: "horizontal",
    autoSaveId: "main-layout",
  },
  [
    ui.resizablePanel({ defaultSize: 25 }, [Sidebar()]),
    ui.resizablePanel({ defaultSize: 75, minSize: 50 }, [Content()]),
  ]
)
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `id` | `string` | **required** | Group identifier |
| `direction` | `"horizontal" \| "vertical"` | **required** | Layout direction |
| `autoSaveId` | `string` | - | App-level key for persisting layout (core does not persist) |

## Notes

- `PanelGroup` distributes space evenly when sizes are not provided.
- `ResizablePanel` size hints are preserved but not applied by core layout.
- Use [`SplitPane`](split-pane.md) for draggable resizing.

## Related

- [Resizable panel](resizable-panel.md)
- [Split pane](split-pane.md)
