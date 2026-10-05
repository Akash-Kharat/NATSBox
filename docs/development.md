# Development

## Prerequisites

- Node.js 18+ (CI uses 20) and npm
- Docker (optional, for the Docker features and a local NATS server)

## Setup

```bash
npm ci        # or npm install
npm run dev   # Vite + tsc watch + Electron
```

## Scripts

| Script | Description |
| --- | --- |
| `dev` | Run renderer dev server (port 5173), watch-compile main, launch Electron |
| `typecheck` | `tsc --noEmit` for `tsconfig.json` (renderer/shared) and `tsconfig.node.json` (main/shared) |
| `test` / `test:watch` | Vitest |
| `build` | `build:renderer` + `build:main` |
| `package` | `build` + `electron-builder` (installers in `release/`) |

## Before opening a PR

```bash
npm run typecheck && npm test && npm run build
```

CI runs the same checks on Ubuntu, Windows and macOS.

## Packaging notes

- Config lives only in `electron-builder.yml`.
- No custom icons are configured. To add them, create `assets/icon.ico|icns|png` and add `icon:` keys under `win`, `mac` and `linux`.
- Use `npm run package -- --dir` for a quick unpacked build.
