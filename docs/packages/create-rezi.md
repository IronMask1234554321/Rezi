# create-rezi

Scaffold a new Rezi terminal UI app in seconds.

## Quickstart

```bash
npm create rezi my-app
cd my-app
npm start
```

## Templates

- `dashboard`: Multi-panel ops dashboard with a status list and activity feed
- `form-app`: Data entry flow with a live preview panel
- `file-browser`: Split view file browser with details + preview
- `streaming-viewer`: Live viewer with chat and stream metrics

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
