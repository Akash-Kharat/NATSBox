/** IPC Channel names for communication between Main and Renderer processes */
export const IPC_CHANNELS = {
  // Connection management
  CONNECT: 'nats:connect',
  DISCONNECT: 'nats:disconnect',
  GET_CONNECTION_STATUS: 'nats:get-connection-status',
  CONNECTION_STATUS_CHANGED: 'nats:connection-status-changed',

  // Publish / Subscribe
  PUBLISH: 'nats:publish',
  SUBSCRIBE: 'nats:subscribe',
  UNSUBSCRIBE: 'nats:unsubscribe',
  MESSAGE_RECEIVED: 'nats:message-received',

  // Request-Reply
  REQUEST: 'nats:request',

  // JetStream
  JS_CREATE_STREAM: 'nats:js-create-stream',
  JS_LIST_STREAMS: 'nats:js-list-streams',
  JS_DELETE_STREAM: 'nats:js-delete-stream',
  JS_PURGE_STREAM: 'nats:js-purge-stream',
  JS_PUBLISH: 'nats:js-publish',
  JS_LIST_CONSUMERS: 'nats:js-list-consumers',
  JS_CREATE_CONSUMER: 'nats:js-create-consumer',
  JS_DELETE_CONSUMER: 'nats:js-delete-consumer',
  JS_BROWSE_MESSAGES: 'nats:js-browse-messages',

  // KV Store
  KV_LIST_BUCKETS: 'nats:kv-list-buckets',
  KV_CREATE_BUCKET: 'nats:kv-create-bucket',
  KV_DELETE_BUCKET: 'nats:kv-delete-bucket',
  KV_GET: 'nats:kv-get',
  KV_PUT: 'nats:kv-put',
  KV_DELETE: 'nats:kv-delete',
  KV_KEYS: 'nats:kv-keys',
  KV_HISTORY: 'nats:kv-history',
  KV_WATCH: 'nats:kv-watch',
  KV_UNWATCH: 'nats:kv-unwatch',
  KV_WATCH_UPDATE: 'nats:kv-watch-update',

  // Load Test
  LOADTEST_START: 'nats:loadtest-start',
  LOADTEST_STOP: 'nats:loadtest-stop',
  LOADTEST_PROGRESS: 'nats:loadtest-progress',

  // Docker / Server Management
  DOCKER_LIST_CONTAINERS: 'docker:list-containers',
  DOCKER_CREATE_CONTAINER: 'docker:create-container',
  DOCKER_START_CONTAINER: 'docker:start-container',
  DOCKER_STOP_CONTAINER: 'docker:stop-container',
  DOCKER_RESTART_CONTAINER: 'docker:restart-container',
  DOCKER_REMOVE_CONTAINER: 'docker:remove-container',
  DOCKER_PULL_IMAGE: 'docker:pull-image',
  DOCKER_CONTAINER_LOGS: 'docker:container-logs',
  DOCKER_CONTAINER_LOGS_STREAM: 'docker:container-logs-stream',

  // Server Monitoring
  MONITOR_START: 'monitor:start',
  MONITOR_STOP: 'monitor:stop',
  MONITOR_METRICS: 'monitor:metrics',

  // Persistence
  SAVE_CONNECTION_CONFIG: 'persist:save-connection',
  LOAD_CONNECTION_CONFIGS: 'persist:load-connections',
  DELETE_CONNECTION_CONFIG: 'persist:delete-connection',
  SAVE_LOAD_TEST_CONFIG: 'persist:save-loadtest',
  LOAD_LOAD_TEST_CONFIGS: 'persist:load-loadtests',
  DELETE_LOAD_TEST_CONFIG: 'persist:delete-loadtest',
  EXPORT_CONFIG: 'persist:export',
  IMPORT_CONFIG: 'persist:import',

  // Namespaced nested mappings for backwards compatibility
  CONNECTION: {
    CONNECT: 'nats:connect',
    DISCONNECT: 'nats:disconnect',
    GET_STATUS: 'nats:get-connection-status',
    STATUS_CHANGED: 'nats:connection-status-changed',
  },
  PUB_SUB: {
    PUBLISH: 'nats:publish',
    SUBSCRIBE: 'nats:subscribe',
    UNSUBSCRIBE: 'nats:unsubscribe',
    MESSAGE_RECEIVED: 'nats:message-received',
  },
  REQUEST_REPLY: {
    REQUEST: 'nats:request',
  },
  JETSTREAM: {
    CREATE_STREAM: 'nats:js-create-stream',
    LIST_STREAMS: 'nats:js-list-streams',
    DELETE_STREAM: 'nats:js-delete-stream',
    PURGE_STREAM: 'nats:js-purge-stream',
    PUBLISH: 'nats:js-publish',
    LIST_CONSUMERS: 'nats:js-list-consumers',
    CREATE_CONSUMER: 'nats:js-create-consumer',
    DELETE_CONSUMER: 'nats:js-delete-consumer',
    BROWSE_MESSAGES: 'nats:js-browse-messages',
  },
  KV: {
    LIST_BUCKETS: 'nats:kv-list-buckets',
    CREATE_BUCKET: 'nats:kv-create-bucket',
    DELETE_BUCKET: 'nats:kv-delete-bucket',
    GET: 'nats:kv-get',
    PUT: 'nats:kv-put',
    DELETE: 'nats:kv-delete',
    KEYS: 'nats:kv-keys',
    HISTORY: 'nats:kv-history',
    WATCH: 'nats:kv-watch',
    UNWATCH: 'nats:kv-unwatch',
    WATCH_UPDATE: 'nats:kv-watch-update',
  },
  LOAD_TEST: {
    START: 'nats:loadtest-start',
    STOP: 'nats:loadtest-stop',
    PROGRESS: 'nats:loadtest-progress',
  },
  DOCKER: {
    LIST_CONTAINERS: 'docker:list-containers',
    CREATE_CONTAINER: 'docker:create-container',
    START_CONTAINER: 'docker:start-container',
    STOP_CONTAINER: 'docker:stop-container',
    RESTART_CONTAINER: 'docker:restart-container',
    REMOVE_CONTAINER: 'docker:remove-container',
    PULL_IMAGE: 'docker:pull-image',
    LOGS: 'docker:container-logs',
    LOGS_STREAM: 'docker:container-logs-stream',
  },
  MONITORING: {
    START: 'monitor:start',
    STOP: 'monitor:stop',
    METRICS: 'monitor:metrics',
  },
  PERSISTENCE: {
    SAVE_CONNECTION_CONFIG: 'persist:save-connection',
    LOAD_CONNECTION_CONFIGS: 'persist:load-connections',
    DELETE_CONNECTION_CONFIG: 'persist:delete-connection',
    SAVE_LOAD_TEST_CONFIG: 'persist:save-loadtest',
    LOAD_LOAD_TEST_CONFIGS: 'persist:load-loadtests',
    DELETE_LOAD_TEST_CONFIG: 'persist:delete-loadtest',
    EXPORT_CONFIG: 'persist:export',
    IMPORT_CONFIG: 'persist:import',
  }
} as const;

/** Default connection configuration values */
export const CONNECTION_DEFAULTS = {
  protocol: 'nats' as const,
  servers: ['localhost:4222'],
  maxReconnectAttempts: -1,
  reconnectTimeWait: 2000,
  pingInterval: 30,
  maxPingOut: 3,
};

/** Default Docker NATS server configuration */
export const DOCKER_DEFAULTS = {
  imageTag: 'nats:latest',
  clientPort: 4222,
  monitorPort: 8222,
  clusterPort: 6222,
};

/** Maximum messages to keep in history per panel */
export const MAX_MESSAGE_HISTORY = 500;

/** Default load test values */
export const LOADTEST_DEFAULTS = {
  totalMessages: 1000,
  ratePerSecond: 100,
  concurrency: 1,
  timeoutMs: 5000,
};

/** Monitoring poll interval options (ms) */
export const MONITOR_INTERVALS = [1000, 5000, 10000, 30000];

/** Application metadata */
export const APP_META = {
  name: 'NATSBox',
  version: '1.0.0',
  description: 'Developer helper to create, test, debug and monitor NATS connectivity',
  website: 'https://nats.io',
};

/** MQTTBox-inspired signature color palette */
export const COLOR_PALETTE = {
  publisher: {
    border: '#0984e3',
    background: '#f0f7ff',
    badge: '#0984e3',
  },
  subscriber: {
    border: '#e17055',
    background: '#fdf6f0',
    badge: '#e17055',
  },
  requestReply: {
    border: '#6c5ce7',
    background: '#f8f7ff',
    badge: '#6c5ce7',
  }
};

export const DEFAULT_SETTINGS = {
  serverUrl: 'localhost:4222',
  monitorPort: 8222,
};

