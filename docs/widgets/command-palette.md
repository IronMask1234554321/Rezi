# `CommandPalette`

A searchable command UI for fast actions (similar to “Command Palette” in editors).

## Usage

```ts
ui.commandPalette({
  id: "palette",
  open: state.open,
  query: state.query,
  sources: [
    {
      id: "cmd",
      name: "Commands",
      prefix: ">",
      getItems: (q) => getCommandItems(q),
    },
  ],
  selectedIndex: state.selectedIndex,
  onQueryChange: (q) => app.update((s) => ({ ...s, query: q })),
  onSelectionChange: (i) => app.update((s) => ({ ...s, selectedIndex: i })),
  onSelect: (item) => runCommand(item.id),
  onClose: () => app.update((s) => ({ ...s, open: false })),
})
```

## Notes

- Command sources can be sync or async (`getItems` may return a `Promise`).
- Keep `query` and `selectedIndex` in your app state (controlled pattern).

Next: [`Code editor`](code-editor.md).
