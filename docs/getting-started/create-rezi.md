# Create Rezi

The fastest way to start a new Rezi app is the scaffolding tool:

```bash
npm create rezi my-app
cd my-app
npm start
```

This generates a TypeScript project with a multi-panel layout, list, status bar, and keybindings.

## Templates

Choose a template interactively or pass `--template`:

```bash
npm create rezi my-app -- --template dashboard
npm create rezi my-app -- --template form-app
npm create rezi my-app -- --template file-browser
npm create rezi my-app -- --template streaming-viewer
```

## Options

- `--template <name>`: Select a template.
- `--no-install`: Skip dependency installation.
- `--pm <npm|pnpm|yarn|bun>`: Choose a package manager.
- `--list-templates`: Print available templates.
- `--help`: Show help.

## Next Steps

- [Quickstart](quickstart.md) for a manual setup walkthrough.
- [Examples](examples.md) for more layouts and patterns.
