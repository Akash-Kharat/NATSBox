# Docker Servers

The **Docker** page manages local NATS servers using the Docker Engine API. Docker must be installed and running, and the user running NATSBox must be able to access the Docker socket / named pipe.

## Create a server

Open **Docker**, fill in **Create NATS Server**:

| Field | Default |
| --- | --- |
| Container Name | - |
| Image Tag | `nats:latest` (pulled automatically) |
| Client Port | 4222 |
| Monitor Port | 8222 (server runs with `-m 8222`) |
| Cluster Port | 6222 |
| Enable JetStream | adds `-js` |
| Custom Configuration | optional `nats-server.conf` content, mounted read-only at `/etc/nats/nats-server.conf` |

## Manage containers

Each container offers **Start**, **Stop**, **Restart**, **View Logs**, **Monitor** (only while running) and **Remove**. Only containers whose image name contains `nats` are listed.

## Monitoring dashboard

**Monitor** opens a live dashboard fed by the server's HTTP monitoring endpoint (`/varz`, `/connz`, `/routez`, `/subsz`, `/jsz`). Choose a refresh interval of 1s, 5s, 10s or 30s. It shows server stats, connections, routes, and JetStream (streams, consumers, messages, memory and file usage).

## Notes

- The monitor port must be reachable from the host (published by Docker).
- Removing a container deletes it; JetStream data lives in the container unless you mount a volume via custom configuration.
