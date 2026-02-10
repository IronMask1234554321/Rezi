# Radio Group

An exclusive-choice group (one selection at a time).

## Usage

```typescript
import { ui } from "@rezi-ui/core";

ui.radioGroup({
  id: "color",
  value: state.color,
  options: [
    { value: "red", label: "Red" },
    { value: "blue", label: "Blue" },
  ],
  onChange: (value) => app.update((s) => ({ ...s, color: value })),
  direction: "vertical",
});
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `id` | `string` | **required** | Unique identifier for focus and event routing |
| `value` | `string` | **required** | Currently selected value |
| `options` | `{ value: string; label: string }[]` | **required** | Available options |
| `onChange` | `(value: string) => void` | - | Called when selection changes |
| `direction` | `"horizontal" \| "vertical"` | `"vertical"` | Layout direction |
| `disabled` | `boolean` | `false` | Disable focus and interaction |
| `key` | `string` | - | Reconciliation key |

## Behavior

- Focusable when enabled.
- Navigate choices with **ArrowUp/ArrowDown** (or left/right in horizontal layouts).
- Confirm with **Enter**.
- **Tab / Shift+Tab** moves focus in/out.

## Examples

### 1) Horizontal layout

```typescript
import { ui } from "@rezi-ui/core";

ui.radioGroup({
  id: "plan",
  value: state.plan,
  direction: "horizontal",
  options: [
    { value: "free", label: "Free" },
    { value: "pro", label: "Pro" },
  ],
  onChange: (v) => app.update((s) => ({ ...s, plan: v })),
});
```

### 2) Disabled

```typescript
import { ui } from "@rezi-ui/core";

ui.radioGroup({
  id: "size",
  value: "m",
  options: [{ value: "m", label: "Medium" }],
  disabled: true,
});
```

## Related

- [Select](select.md) - Dropdown single-choice input
- [Checkbox](checkbox.md) - Boolean toggle
- [Input & Focus](../guide/input-and-focus.md) - Focus navigation rules
