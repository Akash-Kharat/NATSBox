# Troubleshooting & FAQ

## Connection fails ("Connection failed" / timeout)

- Confirm the server is up: `nats-server` running, or `docker ps` shows the container.
- Check host and port (default `localhost:4222`). In Docker, make sure the port is published (`-p 4222:4222`).
- Wrong protocol: use `nats://` for plain, `tls://` when the server requires TLS, `ws://`/`wss://` only if the server has WebSocket enabled.
- Auth errors: verify the auth type matches the server config; for `.creds`, use an absolute path.
- TLS errors: supply the CA certificate path, or (for testing only) untick **Verify Server Certificate**.

## "Workspace Offline"

The selected connection is not connected. Go back to **Connections** and connect it.

## JetStream / KV features error out

The server must be started with JetStream (`-js`). Check with the monitoring dashboard's JetStream section.

## Docker page shows nothing or errors

Docker Desktop/daemon must be running and accessible to your user. On Linux, add your user to the `docker` group. Only containers with `nats` in the image name are listed.

## No messages received

- Check subject spelling and wildcards (`*` one token, `>` the rest).
- Queue-group members share messages: each message goes to only one member.
- A subscriber only receives messages published after it subscribes (core NATS has no replay).

## Windows SmartScreen / macOS Gatekeeper warning

Release builds are unsigned unless signing is configured. Verify the SHA-256 checksum, then choose **More info → Run anyway** (Windows) or right-click → **Open** (macOS).

## `npm ci` fails with EBUSY / EPERM on Windows

Close all running NATSBox/Electron processes (including `npm run dev`) before reinstalling dependencies; Electron's binary is locked while it runs.

## Reporting bugs

Open an issue with your OS, NATSBox version (**About**), NATS server version, and steps to reproduce. Never paste credentials.
