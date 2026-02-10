# `RichText`

Renders multiple styled spans as a single text line.

## Usage

```ts
ui.richText([
  { text: "Error: ", style: { fg: rgb(255, 0, 0), bold: true } },
  { text: "File not found" },
])
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `spans` | `{ text: string; style?: TextStyle }[]` | **required** | Styled text spans |

## Notes

- Spans are concatenated and rendered as a single visual line.
- For multi-line rich text, compose multiple `RichText` or `Text` widgets in a `column`.

## Related

- [Text](text.md)
- [Badge](badge.md)
