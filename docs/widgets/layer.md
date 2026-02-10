# `Layer`

Explicit overlay entry within the layer stack.

## Usage

```ts
ui.layer({
  id: "tooltip",
  zIndex: 100,
  modal: false,
  content: ui.text("Tooltip text"),
})
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `id` | `string` | **required** | Layer identifier |
| `zIndex` | `number` | insertion order | Higher values render on top |
| `backdrop` | `"none" \| "dim" \| "opaque"` | `"none"` | Backdrop behind the layer |
| `modal` | `boolean` | `false` | Block input to lower layers |
| `closeOnEscape` | `boolean` | `true` | Close on Escape key |
| `onClose` | `() => void` | - | Called when layer should close |
| `content` | `VNode` | **required** | Layer content |

## Notes

- Use [`Layers`](layers.md) to manage stacking order and modals.
- `BackdropStyle` values: `"none"`, `"dim"`, `"opaque"`.

## Related

- [Layers](layers.md)
- [Modal](modal.md)
- [Dropdown](dropdown.md)
