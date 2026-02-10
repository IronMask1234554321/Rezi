# `Layers`

Stack-based overlay system used for modals, dropdowns, and transient UI.

## Usage

```ts
ui.layers([
  MainContent(),
  state.showModal && ui.modal({ /* ... */ }),
  state.menuOpen && ui.dropdown({ /* ... */ }),
])
```

## Notes

- Child order defines z-order: later children render on top.
- Use [`Layer`](layer.md) for explicit z-index or custom backdrops.
- Layers enable deterministic hit testing and focus management across overlaps.

## Related

- [Layer](layer.md)
- [Modal](modal.md)
- [Dropdown](dropdown.md)
