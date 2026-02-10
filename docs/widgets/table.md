# Table

Renders tabular data with column definitions, optional sorting, and row selection.

## Usage

```ts
ui.table({
  id: "users",
  columns: [
    { key: "name", header: "Name", flex: 1, sortable: true },
    { key: "role", header: "Role", width: 12 },
  ],
  data: state.users,
  getRowKey: (u) => u.id,
  selection: state.selection,
  selectionMode: "multi",
  onSelectionChange: (keys) => app.update((s) => ({ ...s, selection: keys })),
})
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `id` | `string` | **required** | Unique identifier for focus and events |
| `columns` | `TableColumn[]` | **required** | Column definitions (`key`, `header`, width/flex, sortability, renderers) |
| `data` | `T[]` | **required** | Row data |
| `getRowKey` | `(row: T, index: number) => string` | **required** | Stable key for each row |
| `selection` | `string[]` | `[]` | Currently selected row keys |
| `selectionMode` | `"none" \| "single" \| "multi"` | `"none"` | Selection behavior |
| `onSelectionChange` | `(keys: string[]) => void` | - | Called when selection changes |
| `sortColumn` | `string` | - | Currently sorted column key |
| `sortDirection` | `"asc" \| "desc"` | - | Current sort direction |
| `onSort` | `(column: string, direction: "asc" \| "desc") => void` | - | Called when sort changes |
| `onRowPress` | `(row: T, index: number) => void` | - | Row activation callback |
| `virtualized` | `boolean` | `true` | Enable windowed rendering for large datasets |
| `overscan` | `number` | `3` | Extra rows rendered outside viewport |
| `showHeader` | `boolean` | `true` | Show/hide header row |
| `stripedRows` | `boolean` | `false` | Alternate row background styling |
| `border` | `"none" \| "single"` | `"none"` | Optional border rendering |

## Examples

### Sortable table

```ts
ui.table({
  id: "files",
  columns: [
    { key: "name", header: "Name", flex: 1, sortable: true },
    { key: "size", header: "Size", width: 10, align: "right", sortable: true },
  ],
  data: files,
  getRowKey: (f) => f.path,
  sortColumn: state.sortColumn,
  sortDirection: state.sortDirection,
  onSort: (column, direction) => app.update((s) => ({ ...s, sortColumn: column, sortDirection: direction })),
})
```

## Notes

- Tables can be virtualized; prefer virtualization for large datasets.
- Selection is tracked by row keys. Provide a stable `getRowKey`.

## Related

- [Virtual List](virtual-list.md) - Windowed rendering for large linear datasets
- [Tree](tree.md) - Hierarchical data navigation
- [Input and Focus](../guide/input-and-focus.md) - Keyboard navigation behavior
