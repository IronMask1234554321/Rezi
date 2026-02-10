# Using JSX

Rezi provides a JSX runtime (`@rezi-ui/jsx`) that lets you write widget trees using JSX syntax instead of the `ui.*` function API.

## Setup

1. Install the JSX package:
   ```bash
   npm install @rezi-ui/jsx
   ```

2. Configure TypeScript (`tsconfig.json`):
   ```json
   {
     "compilerOptions": {
       "jsx": "react-jsx",
       "jsxImportSource": "@rezi-ui/jsx"
     }
   }
   ```

3. Use `.tsx` file extensions.

## Example

```tsx
import { createApp, rgb } from "@rezi-ui/core";
import { createNodeBackend } from "@rezi-ui/node";

type State = { count: number };

const app = createApp<State>({
  backend: createNodeBackend(),
  initialState: { count: 0 },
});

app.view((state) =>
  <Column p={1} gap={1}>
    <Text style={{ fg: rgb(120, 200, 255), bold: true }}>Counter</Text>
    <Row gap={2}>
      <Text>Count: {state.count}</Text>
      <Button id="inc" label="+1" />
    </Row>
    <Divider />
    <Text style={{ dim: true }}>Press q to quit</Text>
  </Column>
);

app.keys({
  q: () => app.stop(),
});

await app.start();
```

## Available JSX elements

All `ui.*` widget functions are available as JSX intrinsic elements. The JSX element name matches the `ui.*` function name with a capital first letter:

| `ui.*` API | JSX element |
|---|---|
| `ui.text(...)` | `<Text>` |
| `ui.box(...)` | `<Box>` |
| `ui.row(...)` | `<Row>` |
| `ui.column(...)` | `<Column>` |
| `ui.button(...)` | `<Button>` |
| `ui.input(...)` | `<Input>` |
| `ui.table(...)` | `<Table>` |
| `ui.modal(...)` | `<Modal>` |
| ... | (all 50+ widgets) |

## JSX vs `ui.*` API

Both APIs produce the same VNode trees. Choose based on preference:

```tsx
// JSX style
<Column p={1}>
  <Text style={{ bold: true }}>Hello</Text>
  <Row gap={2}>
    <Button id="ok" label="OK" />
    <Button id="cancel" label="Cancel" />
  </Row>
</Column>

// ui.* style
ui.column({ p: 1 }, [
  ui.text("Hello", { style: { bold: true } }),
  ui.row({ gap: 2 }, [
    ui.button({ id: "ok", label: "OK" }),
    ui.button({ id: "cancel", label: "Cancel" }),
  ]),
])
```

The `ui.*` API has zero runtime overhead — it's direct function calls. The JSX runtime adds a thin `createElement` layer. Both are extremely fast.

## Fragments

Use fragments to group elements without a container:

```tsx
<>
  <Text>Line 1</Text>
  <Text>Line 2</Text>
</>
```

## Note: JSX vs ink-compat

`@rezi-ui/jsx` is the **native Rezi JSX runtime** — it creates Rezi VNodes directly, without React.

`@rezi-ui/ink-compat` is the **Ink compatibility layer** — it uses React and `react-reconciler` to bridge Ink components to Rezi.

If you're starting fresh, use either `ui.*` or `@rezi-ui/jsx`. If you're migrating from Ink, use `@rezi-ui/ink-compat`.
