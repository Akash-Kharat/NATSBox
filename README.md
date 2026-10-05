# NATSBox

[![CI](https://github.com/OWNER/NATSBox/actions/workflows/ci.yml/badge.svg)](https://github.com/OWNER/NATSBox/actions/workflows/ci.yml)

NATSBox is a cross-platform desktop tool for developers working with [NATS](https://nats.io). Inspired by MQTTBox, it gives you a GUI to create, test, debug and monitor NATS connections, publishers and subscribers.

> Replace `OWNER` in the badge URL with your GitHub user or organisation.

## Features

- **Connection management**: save multiple connections (`nats`, `tls`, `ws`, `wss`) with none, token, user/password, NKey or `.creds` authentication, TLS options and reconnect settings.
- **Pub / Sub**: multiple publishers (JSON, text, Base64, hex payloads, headers, reply-to) and subscribers (wildcards, queue groups).
- **Request / Reply**: send requests with a timeout and inspect the response.
- **JetStream**: create, purge and delete streams; manage consumers; browse stored messages.
- **KV Store**: create buckets, add, view and delete keys.
- **Load testing**: publish, subscribe and request/reply tests with live throughput and latency charts.
- **Docker servers**: start, stop and monitor local NATS servers in Docker, with a live monitoring dashboard.

## Documentation

| Guide | Description |
| --- | --- |
| [Getting Started](docs/getting-started.md) | Install and make your first connection |
| [User Guide](docs/user-guide.md) | Every feature, screen by screen |
| [Docker Servers](docs/docker-servers.md) | Run and monitor local NATS servers |
| [Troubleshooting & FAQ](docs/troubleshooting.md) | Common problems and fixes |
| [Architecture](docs/architecture.md) | How the app is built |
| [Development](docs/development.md) | Set up, run, test and build from source |
| [CI/CD & Releases](docs/ci-cd.md) | Workflows, release process, signing |
| [Contributing](CONTRIBUTING.md) · [Security](SECURITY.md) · [Changelog](CHANGELOG.md) | Project policies |

## Quick start (from source)

Requires Node.js 18+ (CI uses Node 20).

```bash
npm install
npm run dev
```

Other commands:

| Command | Purpose |
| --- | --- |
| `npm run typecheck` | Type-check renderer, shared and main code |
| `npm test` | Run unit tests (Vitest) |
| `npm run build` | Compile renderer (Vite) and main process (tsc) into `dist/` |
| `npm run package` | Build and create installers in `release/` |

## Releasing

Bump `version` in `package.json`, update the changelog, then tag and push:

```bash
git tag v1.0.0 && git push origin v1.0.0
```

The [Release workflow](.github/workflows/release.yml) builds Windows, macOS and Linux installers and publishes them to a GitHub Release. See [CI/CD & Releases](docs/ci-cd.md).
