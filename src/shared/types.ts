// ========== Connection Types ==========

export type Protocol = 'nats' | 'ws' | 'wss' | 'tls';

export type AuthType = 'none' | 'token' | 'userpass' | 'nkey' | 'jwt' | 'creds';

export interface AuthConfig {
  type: AuthType;
  token?: string;
  username?: string;
  password?: string;
  nkeySeed?: string;
  nkeyFile?: string;
  credsFile?: string;
  jwt?: string;
}

export interface TLSConfig {
  caFile?: string;
  certFile?: string;
  keyFile?: string;
  rejectUnauthorized?: boolean;
}

export interface ConnectionConfig {
  id: string;
  name: string;
  protocol: Protocol;
  servers: string[];  // e.g., ["localhost:4222"]
  auth: AuthConfig;
  tlsConfig?: TLSConfig;
  enableTls?: boolean;
  maxReconnectAttempts: number;
  reconnectTimeWait: number;  // ms
  pingInterval: number;  // seconds
  maxPingOut: number;
  publishers: PublisherConfig[];
  subscribers: SubscriberConfig[];
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'draining' | 'error';

export interface ConnectionInfo {
  id: string;
  status: ConnectionStatus;
  serverInfo?: {
    serverId: string;
    serverName: string;
    version: string;
    proto: number;
    maxPayload: number;
    jetstream: boolean;
    cluster?: string;
  };
  error?: string;
  connectedAt?: string;
}

// ========== Publisher / Subscriber Types ==========

export type PayloadEncoding = 'utf8' | 'json' | 'base64' | 'hex';

export interface PublisherConfig {
  id: string;
  subject: string;
  payload: string;
  payloadEncoding: PayloadEncoding;
  headers?: Record<string, string>;
  replyTo?: string;
}

export interface SubscriberConfig {
  id: string;
  subject: string;
  queueGroup?: string;
}

export interface NatsMessage {
  id: string;
  subject: string;
  payload: string;
  payloadEncoding: PayloadEncoding;
  headers?: Record<string, string>;
  timestamp: string;
  replyTo?: string;
  size: number;
}

export interface PublishedMessage extends NatsMessage {
  pubId: string;  // which publisher sent it
}

export interface ReceivedMessage extends NatsMessage {
  subId: string;  // which subscriber received it
}

// ========== Request-Reply Types ==========

export interface RequestConfig {
  subject: string;
  payload: string;
  payloadEncoding: PayloadEncoding;
  headers?: Record<string, string>;
  timeout: number;  // ms
}

export interface RequestReplyPair {
  id: string;
  request: NatsMessage;
  response?: NatsMessage;
  status: 'pending' | 'received' | 'timeout' | 'error';
  latencyMs?: number;
  error?: string;
}

// ========== JetStream Types ==========

export type RetentionPolicy = 'limits' | 'interest' | 'workqueue';
export type StorageType = 'file' | 'memory';
export type DiscardPolicy = 'old' | 'new';
export type DeliverPolicy = 'all' | 'last' | 'new' | 'by_start_sequence' | 'by_start_time' | 'last_per_subject';
export type AckPolicy = 'none' | 'all' | 'explicit';
export type ReplayPolicy = 'instant' | 'original';

export interface StreamConfig {
  name: string;
  subjects: string[];
  retention: RetentionPolicy;
  storage: StorageType;
  maxMsgs: number;
  maxBytes: number;
  maxAge: number;  // nanoseconds
  maxMsgSize: number;
  discard: DiscardPolicy;
  replicas: number;
  description?: string;
}

export interface StreamInfo {
  config: StreamConfig;
  state: {
    messages: number;
    bytes: number;
    firstSeq: number;
    lastSeq: number;
    consumerCount: number;
    firstTs: string;
    lastTs: string;
  };
}

export interface ConsumerConfig {
  durableName?: string;
  deliverPolicy: DeliverPolicy;
  ackPolicy: AckPolicy;
  replayPolicy: ReplayPolicy;
  filterSubject?: string;
  description?: string;
  maxDeliver?: number;
  ackWait?: number;  // nanoseconds
  maxAckPending?: number;
}

export interface ConsumerInfo {
  name: string;
  config: ConsumerConfig;
  numPending: number;
  numAckPending: number;
  numRedelivered: number;
  delivered: { streamSeq: number; consumerSeq: number };
  ackFloor: { streamSeq: number; consumerSeq: number };
}

export interface JetStreamPublishAck {
  stream: string;
  seq: number;
  duplicate: boolean;
}

export interface BrowseMessagesOptions {
  startSequence?: number;
  batchSize?: number;
  filterSubject?: string;
}

export interface StoredMessage {
  sequence: number;
  subject: string;
  payload: string;
  timestamp: string;
  headers?: Record<string, string>;
}

// ========== KV Store Types ==========

export interface KVEntry {
  bucket: string;
  key: string;
  value: string;
  revision: number;
  created: string;
  operation: 'PUT' | 'DEL' | 'PURGE';
}

export interface KVBucketInfo {
  bucket: string;
  values: number;
  history: number;
  ttl: number;
  storage: StorageType;
  replicas: number;
  bytes: number;
}

// ========== Load Test Types ==========

export type LoadTestType = 'publish' | 'subscribe' | 'request-reply';

export interface LoadTestConfig {
  id: string;
  name: string;
  connectionId: string;
  type: LoadTestType;
  subject: string;
  payloadTemplate: string;
  payloadEncoding: PayloadEncoding;
  totalMessages: number;
  ratePerSecond: number;
  ratePerSec?: number;
  concurrency: number;
  timeoutMs: number;
  useJetStream: boolean;
  payloadSize?: number;
}

export interface LoadTestProgress {
  testId: string;
  status: 'running' | 'completed' | 'stopped' | 'error';
  messagesSent: number;
  messagesReceived: number;
  sent?: number;
  received?: number;
  errors: number;
  elapsedMs?: number;
  currentRate: number;  // msgs/sec
  avgLatencyMs?: number;
  p50LatencyMs?: number;
  p95LatencyMs?: number;
  p99LatencyMs?: number;
  latencies?: {
    min: number;
    max: number;
    p50: number;
    p95: number;
    p99: number;
    avg: number;
  };
  dataPoints?: LoadTestDataPoint[];
}

export interface LoadTestDataPoint {
  timestamp: number;
  messagesSent: number;
  messagesReceived: number;
  errors: number;
  latencyMs: number;
  rate?: number;
  latency?: number;
  sentRate?: number;
  receivedRate?: number;
  p50Latency?: number;
  p95Latency?: number;
  p99Latency?: number;
}

// ========== Docker / Server Monitoring Types ==========

export interface DockerContainer {
  id: string;
  name: string;
  image: string;
  status: 'running' | 'stopped' | 'created' | 'removing' | 'paused' | 'exited' | 'dead';
  ports: { host: number; container: number; protocol: string; privatePort?: number; publicPort?: number; type?: string }[];
  created: string;
  state: string;
}

export interface NatsServerConfig {
  containerName?: string;
  name?: string;
  imageTag?: string;  // default "nats:latest"
  image?: string;
  clientPort: number;  // default 4222
  monitorPort: number;  // default 8222
  clusterPort: number;  // default 6222
  jetStream?: boolean;
  jetstream?: boolean;
  jetStreamStoreDir?: string;
  configContent?: string;  // raw nats-server.conf content
}

export interface ServerVarz {
  server_id: string;
  server_name: string;
  version: string;
  uptime: string;
  mem: number;
  cpu: number;
  connections: number;
  total_connections: number;
  subscriptions: number;
  in_msgs: number;
  out_msgs: number;
  in_bytes: number;
  out_bytes: number;
  slow_consumers: number;
  max_payload: number;
  jetstream?: {
    config: { max_memory: number; max_storage: number; store_dir: string };
    stats: { memory: number; storage: number; accounts: number; api: { total: number; errors: number } };
  };
}

export interface ServerConnz {
  num_connections: number;
  total: number;
  connections: {
    cid: number;
    name: string;
    ip: string;
    port: number;
    subscriptions: number;
    in_msgs: number;
    out_msgs: number;
    in_bytes: number;
    out_bytes: number;
    pending_bytes: number;
    lang: string;
    version: string;
    uptime: string;
  }[];
}

export interface ServerRoutez {
  num_routes: number;
  routes: {
    rid: number;
    remote_id: string;
    ip: string;
    port: number;
    in_msgs: number;
    out_msgs: number;
    in_bytes: number;
    out_bytes: number;
    subscriptions: number;
  }[];
}

export interface ServerSubsz {
  num_subscriptions: number;
  num_cache: number;
  num_inserts: number;
  num_removes: number;
  num_matches: number;
  cache_hit_rate: number;
  max_fanout: number;
  avg_fanout: number;
}

export interface ServerJsz {
  streams: number;
  consumers: number;
  messages: number;
  bytes: number;
  memory: number;
  storage: number;
}

export interface ServerMetrics {
  varz?: ServerVarz;
  connz?: ServerConnz;
  routez?: ServerRoutez;
  subsz?: ServerSubsz;
  jsz?: ServerJsz;
  lastUpdated: string;
  error?: string;
}

// ========== UI / App State Types ==========

export interface SnackbarMessage {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
}
