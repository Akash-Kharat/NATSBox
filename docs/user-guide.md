# User Guide

The sidebar contains **Connections**, **Load Testing**, **Docker**, **Settings** and **About**, plus the **New Connection** button.

## Contents

1. [Connections](#connections)
2. [Pub / Sub](#pub--sub)
3. [Request / Reply](#request--reply)
4. [JetStream](#jetstream)
5. [KV Store](#kv-store)
6. [Load Testing](#load-testing)
7. [Settings](#settings)

---

## Connections

Create one with **New Connection**; edit or delete one from its settings (gear icon) in the connection workspace.

| Field | Notes |
| --- | --- |
| Connection Name | Free text, e.g. `Production Cluster` |
| Protocol | `nats://`, `tls://`, `ws://`, `wss://` |
| Servers | Comma-separated list, e.g. `n1:4222, n2:4222` |
| Authentication | None, Token, Username & Password, NKey (seed), Credentials File (path to a `.creds` file) |
| TLS (for `tls`/`wss`) | Verify server certificate, CA certificate path, client certificate and key paths |
| Max Reconnects | `-1` = retry forever |
| Reconnect Wait (ms) | Delay between reconnect attempts (default 2000) |

**Test Connection** connects and immediately disconnects without saving anything.

> Credentials, tokens and key paths are stored locally on your machine. Do not share exported configuration files without reviewing them. See [SECURITY.md](../SECURITY.md).

## Pub / Sub

Open a connection and select the **Pub / Sub** tab. The connection must be connected ("Workspace Offline" is shown otherwise).

**Publisher**
- *Subject*: e.g. `sensor.temperature`.
- *Payload* with format **JSON**, **Text**, **Base64** or **Hex**. A **Format JSON** button prettifies JSON.
- *Reply-To* (optional) and custom *headers* (key/value pairs).
- Add several publishers per connection; remove one with its trash icon.

**Subscriber**
- *Subject* supports NATS wildcards: `*` matches one token, `>` matches the rest (e.g. `sensor.>`).
- *Queue Group* (optional): subscribers in the same group share messages, so each message goes to one member.
- Received messages show subject, time, size and payload, with a copy button.

## Request / Reply

Select the **Request / Reply** tab: enter *Subject*, *Payload* and *Timeout (ms)*, then send. The **Response** panel shows response data; a timeout or error is reported if no responder answers in time. Latency is recorded per request.

Tip: run a responder with `nats reply demo.echo "pong"` and request on `demo.echo`.

## JetStream

Requires a server started with JetStream enabled (`-js`).

**Streams**
- Create with: Stream Name, Subjects (comma separated), Description, Storage (File/Memory), Replicas, Retention (Limits/Interest/Work queue), Discard (Old/New), Max Messages, Max Bytes, Max Age (e.g. `1h`, `7d`), Max Message Size. Use `-1` for unlimited.
- Each stream card shows message, byte and consumer counts. Refresh, **Purge Messages** and **Delete Stream** are available; purge and delete are destructive.

**Consumers**
- Create with: Durable Name, Filter Subject, Deliver Policy, Ack Policy, Replay Policy, Max Deliveries.
- The table shows Pending and Ack Pending counts; delete a consumer with the trash icon.

**Message browser**
- Filter by subject, choose a *Start Seq* and *Batch Size*, then browse. Selecting a message shows headers and payload.

## KV Store

- **Create bucket**: name, history, TTL (ms) and storage (File/Memory).
- **Browse keys**: search, add a key (name + initial value), view the value and revision, delete keys.

## Load Testing

Open **Load Testing** in the sidebar, then create a test profile:

| Setting | Description |
| --- | --- |
| Profile Name / Target Connection | Which saved connection to use |
| Test Mode | **Publish Only** (throughput), **Subscribe Only** (drain), **Request / Reply** (latency) |
| Target Subject | Subject to publish, subscribe or request on |
| Total Messages | Messages to send in the run |
| Rate (msgs/sec) | Target rate |
| Concurrency | Parallel workers |
| Timeout (ms) | Per-request timeout |
| Payload Template | JSON or plain-text template |

Run it from the profile; the dashboard shows overall progress, live msgs/sec, errors and latency percentiles (p50/p95/p99). You can stop a running test.

> Load tests generate real traffic. Do not point them at shared or production servers without permission.

## Settings

The Settings page currently shows appearance (theme), connection defaults (global timeout, max history lines) and export/import of connections.

> **Status:** these controls are not yet wired to persistent behaviour; the export/import buttons only display a confirmation message and do not write or read a file. This guide will be updated when that is implemented.
