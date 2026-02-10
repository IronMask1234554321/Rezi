# @rezi-ui/ink-compat

Drop-in Ink compatibility layer that lets you run existing [Ink](https://github.com/vadimdemedes/ink) React components on Rezi's native rendering engine.

## Installation

```bash
npm install @rezi-ui/ink-compat @rezi-ui/core @rezi-ui/node react
```

## Overview

`@rezi-ui/ink-compat` provides the same API surface as `ink`:

- All 6 Ink components: `Box`, `Text`, `Spacer`, `Newline`, `Transform`, `Static`
- All 7 Ink hooks: `useInput`, `useApp`, `useFocus`, `useFocusManager`, `useStdin`, `useStdout`, `useStderr`
- The `render()` function with all standard options

Under the hood, it uses `react-reconciler` to bridge React component trees into Rezi VNodes, which are then rendered by the Zireael C engine.

## Usage

```tsx
import { render, Box, Text, useInput, useApp } from "@rezi-ui/ink-compat";

const App = () => {
  const { exit } = useApp();

  useInput((input, key) => {
    if (input === "q") exit();
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold>Hello from Rezi!</Text>
      <Text>Press q to quit</Text>
    </Box>
  );
};

render(<App />);
```

## render() API

```typescript
const instance = render(element, options?);
```

**Options:**

| Option | Type | Default | Description |
|---|---|---|---|
| `stdout` | `NodeJS.WriteStream` | `process.stdout` | Output stream |
| `stdin` | `NodeJS.ReadStream` | `process.stdin` | Input stream |
| `stderr` | `NodeJS.WriteStream` | `process.stderr` | Error stream |
| `exitOnCtrlC` | `boolean` | `true` | Exit on Ctrl+C |
| `patchConsole` | `boolean` | `true` | Capture console.log into app |
| `debug` | `boolean` | `false` | Enable debug mode |

**Instance methods:**

- `instance.rerender(element)` — Update the rendered element
- `instance.unmount()` — Unmount and clean up
- `instance.clear()` — Clear the output
- `instance.waitUntilExit()` — Returns a promise that resolves when the app exits

## Performance

Using ink-compat gives you **70–200x** speedup over stock Ink, with zero code changes beyond swapping the import. See the [benchmark results](../benchmarks.md) for details.

## Further reading

- [Migration guide](../migration/ink.md) — Step-by-step instructions for migrating from Ink
- [Benchmarks](../benchmarks.md) — Detailed performance comparison
