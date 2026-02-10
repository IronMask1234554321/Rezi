# Input

A single-line, controlled text input widget with cursor navigation and editing support.

## Usage

```typescript
ui.input({
  id: "name",
  value: state.name,
  onInput: (value) => app.update((s) => ({ ...s, name: value })),
})
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `id` | `string` | **required** | Unique identifier for focus and event routing |
| `value` | `string` | **required** | Current input value (controlled) |
| `disabled` | `boolean` | `false` | Disable editing and dim appearance |
| `style` | `TextStyle` | - | Custom styling (merged with focus/disabled state) |
| `onInput` | `(value: string, cursor: number) => void` | - | Callback when value changes |
| `onBlur` | `() => void` | - | Callback when input loses focus |
| `key` | `string` | - | Reconciliation key for dynamic lists |

## Behavior

Inputs are focusable when enabled. When focused:

- Text entry inserts at cursor position
- **Left/Right** arrows move the cursor
- **Home/End** move to start/end of input
- **Backspace** deletes character before cursor
- **Delete** deletes character after cursor
- **Tab** moves focus to next widget
- **Ctrl+A** selects all (where supported)

Inputs are always controlled - the `value` prop determines what is displayed.

## Examples

### Controlled input

```typescript
type State = { email: string };

app.view((state) =>
  ui.input({
    id: "email",
    value: state.email,
    onInput: (value) => app.update((s) => ({ ...s, email: value })),
  })
);
```

### Validation on blur

Use `onBlur` to trigger validation when the user leaves the field:

```typescript
ui.input({
  id: "email",
  value: state.email,
  onInput: (value) => app.update((s) => ({ ...s, email: value })),
  onBlur: () => validateEmail(state.email),
})
```

### With a `field` wrapper

Combine with `field` for labels and error display:

```typescript
ui.field({
  label: "Email",
  required: true,
  error: state.errors.email,
  children: ui.input({
    id: "email",
    value: state.email,
    onInput: (v) => app.update((s) => ({ ...s, email: v })),
  }),
})
```

## Unicode Handling

Text editing is based on grapheme clusters using a pinned Unicode version. This ensures:

- Emoji and combined characters are handled as single units
- Cursor movement is consistent across platforms
- Deterministic behavior for any input string

## Related

- [Field](field.md) - Form field wrapper
- [Button](button.md) - Clickable button
- [Checkbox](checkbox.md) - Toggle checkbox
