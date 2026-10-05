# Architecture

NATSBox is an Electron app with a React renderer.

```
src/
  main/         Electron main process (Node.js)
    main.ts, preload.ts
    ipc/handlers.ts            IPC channel registration
    services/                  NatsConnectionManager, NatsSubscriptionManager,
                               JetStreamService, KVStoreService, LoadTestService,
                               DockerService, NatsMonitoringService, PersistenceService
  renderer/     React 18 UI (Vite)
    components/ stores/ (Zustand) hooks/ styles/ __tests__/
  shared/       Types and constants shared by both processes
dist/           Build output (main/ via tsc, renderer/ via Vite)
release/        Installers from electron-builder
```

## Process model

- The **renderer** has no Node integration. It talks to the main process only through the API exposed by `preload.ts` via `contextBridge` (`window.natsAPI`).
- The **main process** owns all network and system access: NATS connections (`nats` client), Docker (`dockerode`), HTTP monitoring and persistence (`electron-store`).
- Types in `src/shared` define the IPC payloads (connection config, JetStream, KV, load test, monitoring).

## Build outputs

- Renderer: `vite build` → `dist/renderer`.
- Main: `tsc -p tsconfig.node.json` → `dist/main` (entry `dist/main/main/main.js`).
- Packaging: `electron-builder` (config in `electron-builder.yml`) → `release/`.

## State

Renderer state is split into Zustand stores (connections, messages, JetStream, KV, load tests, servers, UI). Saved connections are persisted by the main process.
