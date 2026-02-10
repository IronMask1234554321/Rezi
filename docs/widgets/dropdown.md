# `Dropdown`

Dropdown menu positioned relative to an anchor widget.

## Usage

```ts
ui.dropdown({
  id: "file-menu",
  anchorId: "file-button",
  position: "below-start",
  items: [
    { id: "new", label: "New", shortcut: "Ctrl+N" },
    { id: "open", label: "Open", shortcut: "Ctrl+O" },
    { id: "divider", label: "", divider: true },
    { id: "exit", label: "Exit" },
  ],
  onSelect: (item) => handleAction(item.id),
  onClose: () => app.update((s) => ({ ...s, menuOpen: false })),
})
```

## Notes

- Use `anchorId` to position the dropdown relative to an element in the layout tree.
- Render dropdowns inside `ui.layers(...)` so they stack above base UI.

