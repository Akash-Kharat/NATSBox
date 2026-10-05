# Getting Started

## Install

### From a release

Download the installer for your OS from the project's **Releases** page:

| OS | File |
| --- | --- |
| Windows | `NATSBox-<version>-win-x64.exe` (NSIS installer) |
| macOS | `NATSBox-<version>-mac-<arch>.dmg` |
| Linux | `NATSBox-<version>-linux-x86_64.AppImage` (`chmod +x`, then run) |

Verify the download against `SHA256SUMS.txt` attached to the release:

```bash
sha256sum -c SHA256SUMS.txt --ignore-missing
```

> Builds are unsigned unless the maintainers configured signing (see [CI/CD](ci-cd.md)). Windows SmartScreen or macOS Gatekeeper may warn on first launch.

### From source

See [Development](development.md).

## Get a NATS server to talk to

Any NATS server works. The quickest options:

- **Inside NATSBox**: open **Docker** in the sidebar and create a server (requires Docker). See [Docker Servers](docker-servers.md).
- **Docker CLI**: `docker run -p 4222:4222 -p 8222:8222 nats:latest -js -m 8222`
- **Binary**: `nats-server -js`

## First connection

1. Click **New Connection** (bottom of the sidebar).
2. Keep the defaults (`nats://`, server `localhost:4222`, no auth) and click **Test Connection**. You should see "Successfully connected!".
3. Click **Add Connection**.
4. On the **Connections** page, open the connection to reach its workspace with the **Pub / Sub**, **Request / Reply**, **JetStream** and **KV Store** tabs.
5. In **Pub / Sub**, add a subscriber on `demo.>` and a publisher on `demo.hello`, then publish. The message appears under the subscriber.

Next: the [User Guide](user-guide.md).
