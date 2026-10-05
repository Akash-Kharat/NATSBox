import { connect, NatsConnection, ConnectionOptions, StringCodec, headers as natsHeaders, Subscription, nkeyAuthenticator, credsAuthenticator } from 'nats';
import { EventEmitter } from 'events';
import { ConnectionConfig, ConnectionInfo } from '../../shared/types';
import fs from 'fs';

const sc = StringCodec();

export class NatsConnectionManager extends EventEmitter {
  private static instance: NatsConnectionManager;
  private connections: Map<string, NatsConnection> = new Map();
  private subscriptions: Map<string, Subscription> = new Map();

  private constructor() {
    super();
  }

  public static getInstance(): NatsConnectionManager {
    if (!NatsConnectionManager.instance) {
      NatsConnectionManager.instance = new NatsConnectionManager();
    }
    return NatsConnectionManager.instance;
  }

  public async connect(config: any): Promise<ConnectionInfo> {
    let servers: string[] = [];
    if (Array.isArray(config.servers) && config.servers.length > 0) {
      servers = config.servers.map((s: string) => s.trim()).filter(Boolean);
    } else if (typeof config.servers === 'string' && config.servers.trim().length > 0) {
      servers = config.servers.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
    if (servers.length === 0) {
      servers = ['localhost:4222'];
    }

    const options: ConnectionOptions = {
      servers,
      name: config.name || 'NATSBox Client',
      maxReconnectAttempts: config.maxReconnectAttempts ?? -1,
      reconnectTimeWait: config.reconnectTimeWait ?? 2000,
      pingInterval: (config.pingInterval ?? 30) * 1000,
      maxPingOut: config.maxPingOut ?? 3,
    };

    // Authentication handling
    const auth = config.auth || {};
    const authType = config.authType || auth.type || 'none';

    if (authType === 'token' && (config.token || auth.token)) {
      options.token = config.token || auth.token;
    } else if (authType === 'userpass' && (config.username || auth.username)) {
      options.user = config.username || auth.username;
      options.pass = config.password || auth.password;
    } else if (authType === 'nkey' && (config.nkeySeed || auth.nkeySeed)) {
      const seed = (config.nkeySeed || auth.nkeySeed).trim();
      options.authenticator = nkeyAuthenticator(new TextEncoder().encode(seed));
    } else if (authType === 'creds' && (config.credsFile || auth.credsFile)) {
      const credsPath = config.credsFile || auth.credsFile;
      if (fs.existsSync(credsPath)) {
        const credsData = fs.readFileSync(credsPath);
        options.authenticator = credsAuthenticator(credsData);
      }
    }

    // TLS Handling
    if (config.protocol === 'tls' || config.protocol === 'wss' || config.tlsConfig) {
      const tls: any = {};
      const tlsCfg = config.tlsConfig || {};
      if (tlsCfg.rejectUnauthorized !== undefined) {
        tls.rejectUnauthorized = tlsCfg.rejectUnauthorized;
      }
      if (tlsCfg.caFile && fs.existsSync(tlsCfg.caFile)) {
        tls.ca = fs.readFileSync(tlsCfg.caFile);
      }
      if (tlsCfg.certFile && fs.existsSync(tlsCfg.certFile)) {
        tls.cert = fs.readFileSync(tlsCfg.certFile);
      }
      if (tlsCfg.keyFile && fs.existsSync(tlsCfg.keyFile)) {
        tls.key = fs.readFileSync(tlsCfg.keyFile);
      }
      options.tls = tls;
    }

    try {
      const nc = await connect(options);
      this.connections.set(config.id, nc);
      
      // Listen for connection status changes asynchronously
      (async () => {
        for await (const s of nc.status()) {
          // Skip pure debug/internal events that don't represent real state changes
          if (s.type === 'pingTimer' || s.type === 'staleConnection' || s.type === 'client initiated reconnect') {
            continue;
          }

          let mappedStatus: string = s.type;
          if (s.type === 'reconnect') mappedStatus = 'connected';
          else if (s.type === 'disconnect') mappedStatus = 'disconnected';
          else if (s.type === 'error') mappedStatus = 'error';
          else if (s.type === 'reconnecting') mappedStatus = 'reconnecting';
          else if (s.type === 'ldm') mappedStatus = 'reconnecting'; // lame duck mode

          this.emit('statusChanged', { 
            connId: config.id, 
            status: mappedStatus, 
            data: s.data,
            serverInfo: nc.info ? {
              serverId: nc.info.server_id,
              serverName: nc.info.server_name,
              version: nc.info.version,
              proto: nc.info.proto,
              maxPayload: nc.info.max_payload,
              jetstream: !!nc.info.jetstream,
              cluster: nc.info.cluster
            } : undefined
          });
        }
      })().catch(console.error);

      // When connection is permanently closed (e.g. max reconnects exceeded), emit final disconnected
      nc.closed().then((err?: void | Error) => {
        if (this.connections.has(config.id)) {
          // Only emit if we didn't intentionally close it (drain removes from map)
          this.emit('statusChanged', {
            connId: config.id,
            status: 'disconnected',
            error: err instanceof Error ? err.message : undefined,
            data: err instanceof Error ? err.message : 'Connection closed'
          });
        }
      }).catch(() => {/* ignore */});

      const statusInfo = this.getStatus(config.id)!;
      this.emit('statusChanged', {
        connId: config.id,
        status: 'connected',
        serverInfo: statusInfo.serverInfo
      });

      return statusInfo;
    } catch (err: any) {
      this.emit('statusChanged', {
        connId: config.id,
        status: 'error',
        error: err.message
      });
      throw new Error(`Failed to connect to NATS: ${err.message}`);
    }
  }

  public async disconnect(connId: string): Promise<void> {
    const nc = this.connections.get(connId);
    if (nc) {
      // Remove from map FIRST so nc.closed() doesn't fire a spurious 'disconnected' event
      this.connections.delete(connId);
      try {
        await nc.drain();
      } catch {
        // ignore drain errors on intentional close
      }
    }
  }

  public getStatus(connId: string): ConnectionInfo | null {
    const nc = this.connections.get(connId);
    if (!nc) return null;
    const info = nc.info;
    return {
      id: connId,
      status: nc.isClosed() ? 'disconnected' : 'connected',
      connectedAt: new Date().toISOString(),
      serverInfo: info ? {
        serverId: info.server_id,
        serverName: info.server_name,
        version: info.version,
        proto: info.proto,
        maxPayload: info.max_payload,
        jetstream: !!info.jetstream,
        cluster: info.cluster
      } : undefined
    };
  }

  public publish(
    connIdOrArgs: string | { connectionId?: string; connId?: string; subject: string; payload?: string; replyTo?: string; headers?: Record<string, string> },
    subject?: string,
    payload?: string,
    options?: { replyTo?: string; headers?: Record<string, string> }
  ): void {
    let connId: string;
    let subj: string;
    let payl: string | undefined;
    let replyTo: string | undefined;
    let hdrs: Record<string, string> | undefined;

    if (typeof connIdOrArgs === 'object') {
      connId = connIdOrArgs.connectionId || connIdOrArgs.connId || '';
      subj = connIdOrArgs.subject;
      payl = connIdOrArgs.payload;
      replyTo = connIdOrArgs.replyTo;
      hdrs = connIdOrArgs.headers;
    } else {
      connId = connIdOrArgs;
      subj = subject!;
      payl = payload;
      replyTo = options?.replyTo;
      hdrs = options?.headers;
    }

    const nc = this.connections.get(connId);
    if (!nc) throw new Error('Connection not found');
    
    let h;
    if (hdrs && Object.keys(hdrs).length > 0) {
      h = natsHeaders();
      for (const [k, v] of Object.entries(hdrs)) {
        h.append(k, String(v));
      }
    }

    nc.publish(subj, payl ? sc.encode(payl) : undefined, { reply: replyTo, headers: h });
  }

  public async subscribe(
    connIdOrArgs: string | { connectionId?: string; connId?: string; subId?: string; subject: string; queueGroup?: string },
    subjectOrCb?: string | ((msg: any) => void),
    callbackOrOpts?: ((msg: any) => void) | any,
    options?: any
  ): Promise<string> {
    let connId: string;
    let subj: string;
    let queue: string | undefined;
    let onMessage: (msg: any) => void;
    let explicitSubId: string | undefined;

    if (typeof connIdOrArgs === 'object') {
      connId = connIdOrArgs.connectionId || connIdOrArgs.connId || '';
      subj = connIdOrArgs.subject;
      queue = connIdOrArgs.queueGroup;
      explicitSubId = connIdOrArgs.subId;
      onMessage = subjectOrCb as (msg: any) => void;
    } else {
      connId = connIdOrArgs;
      subj = subjectOrCb as string;
      onMessage = callbackOrOpts as (msg: any) => void;
      queue = options?.queue;
    }

    const nc = this.connections.get(connId);
    if (!nc) throw new Error('Connection not found');

    const subId = explicitSubId || Math.random().toString(36).substring(7);

    // If a subscription with this subId already exists, drain it first to prevent leaks
    if (this.subscriptions.has(subId)) {
      const oldSub = this.subscriptions.get(subId);
      if (oldSub) await oldSub.drain();
      this.subscriptions.delete(subId);
    }

    const sub = nc.subscribe(subj, queue ? { queue } : undefined);
    this.subscriptions.set(subId, sub);

    (async () => {
      try {
        for await (const m of sub) {
          const headers: Record<string, string> = {};
          if (m.headers) {
            for (const [key, value] of m.headers) {
              headers[key] = value.join(',');
            }
          }
          if (typeof onMessage === 'function') {
            onMessage({
              id: Math.random().toString(36).substring(7),
              connectionId: connId,
              subId,
              subject: m.subject,
              payload: m.data.length > 0 ? sc.decode(m.data) : '',
              payloadEncoding: 'utf8',
              replyTo: m.reply,
              headers,
              size: m.data.length,
              timestamp: new Date().toISOString()
            });
          }
        }
      } catch (err) {
        console.error('Subscription loop error:', err);
      }
    })().catch(console.error);

    return subId;
  }

  public async unsubscribe(subIdOrConnId: string, subId?: string): Promise<void> {
    const targetSubId = subId || subIdOrConnId;
    const sub = this.subscriptions.get(targetSubId);
    if (sub) {
      await sub.drain();
      this.subscriptions.delete(targetSubId);
    }
  }

  public async request(
    connIdOrArgs: string | { connectionId?: string; connId?: string; subject: string; payload?: string; timeout?: number; headers?: Record<string, string> },
    subject?: string,
    payload?: string,
    timeout?: number,
    headers?: Record<string, string>
  ): Promise<any> {
    let connId: string;
    let subj: string;
    let payl: string | undefined;
    let timeoutMs: number;
    let hdrs: Record<string, string> | undefined;

    if (typeof connIdOrArgs === 'object') {
      connId = connIdOrArgs.connectionId || connIdOrArgs.connId || '';
      subj = connIdOrArgs.subject;
      payl = connIdOrArgs.payload;
      timeoutMs = connIdOrArgs.timeout || 5000;
      hdrs = connIdOrArgs.headers;
    } else {
      connId = connIdOrArgs;
      subj = subject!;
      payl = payload;
      timeoutMs = timeout || 5000;
      hdrs = headers;
    }

    const nc = this.connections.get(connId);
    if (!nc) throw new Error('Connection not found');
    
    let h;
    if (hdrs && Object.keys(hdrs).length > 0) {
      h = natsHeaders();
      for (const [k, v] of Object.entries(hdrs)) {
        h.append(k, String(v));
      }
    }

    const start = Date.now();
    const msg = await nc.request(subj, payl ? sc.encode(payl) : undefined, { timeout: timeoutMs, headers: h });
    const latencyMs = Date.now() - start;
    
    const respHeaders: Record<string, string> = {};
    if (msg.headers) {
      for (const [key, value] of msg.headers) {
        respHeaders[key] = value.join(',');
      }
    }

    return {
      id: Math.random().toString(36).substring(7),
      subject: msg.subject,
      payload: msg.data.length > 0 ? sc.decode(msg.data) : '',
      payloadEncoding: 'utf8',
      headers: respHeaders,
      latencyMs,
      timestamp: new Date().toISOString()
    };
  }

  public getConnection(connId: string): NatsConnection | undefined {
    return this.connections.get(connId);
  }
}

export const natsManager = NatsConnectionManager.getInstance();
export default natsManager;
