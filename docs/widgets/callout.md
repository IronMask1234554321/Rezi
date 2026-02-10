# `Callout`

Highlighted message box for important information.

## Usage

```ts
ui.callout("Connection restored", {
  variant: "success",
  title: "Online",
})
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `message` | `string` | **required** | Callout text |
| `variant` | `"info" \| "success" \| "warning" \| "error"` | `"info"` | Visual variant |
| `title` | `string` | - | Optional title line |
| `icon` | `string` | - | Optional icon override |
| `style` | `TextStyle` | - | Optional style override |

## Related

- [Error display](error-display.md)
- [Badge](badge.md)
