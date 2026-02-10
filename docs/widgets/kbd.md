# Kbd

Displays keyboard shortcuts in a compact, consistent style.

## Usage

```typescript
import { ui } from "@rezi-ui/core";

ui.kbd("Ctrl+S");
ui.kbd(["Ctrl", "Shift", "P"]);
ui.kbd("Cmd+K", { separator: " " });
```

## Props

`ui.kbd(keys, props?)` takes required keys plus optional props.

| Prop | Type | Default | Description |
|---|---|---|---|
| `keys` | `string \| string[]` | **required** | Keys to display |
| `separator` | `string` | `"+"` | Separator between key parts |
| `style` | `TextStyle` | - | Optional style override |
| `key` | `string` | - | Reconciliation key |

## Examples

### 1) Help line

```typescript
import { ui } from "@rezi-ui/core";

ui.row({ gap: 1 }, [ui.kbd(["Ctrl", "S"]), ui.text("Save")]);
```

### 2) Multiple shortcuts

```typescript
import { ui } from "@rezi-ui/core";

ui.row({ gap: 2 }, [
  ui.row({ gap: 1 }, [ui.kbd("j"), ui.text("Down")]),
  ui.row({ gap: 1 }, [ui.kbd("k"), ui.text("Up")]),
]);
```

## Related

- [Keyboard Shortcuts recipe](../recipes/keyboard-shortcuts.md) - Global bindings with `app.keys`
- [Input & Focus](../guide/input-and-focus.md) - Navigation model
