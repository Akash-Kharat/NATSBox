import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

// Self-contained channel constants to ensure zero-dependency preload execution across all sandboxing modes
const CHANNELS = {
  CONNECT: 'nats:connect',
  DISCONNECT: 'nats:disconnect',
  GET_CONNECTION_STATUS: 'nats:get-connection-status',
  CONNECTION_STATUS_CHANGED: 'nats:connection-status-changed',
  PUBLISH: 'nats:publish',
  SUBSCRIBE: 'nats:subscribe',
  UNSUBSCRIBE: 'nats:unsubscribe',
  MESSAGE_RECEIVED: 'nats:message-received',
  REQUEST: 'nats:request',
  JS_CREATE_STREAM: 'nats:js-create-stream',
  JS_LIST_STREAMS: 'nats:js-list-streams',
  JS_DELETE_STREAM: 'nats:js-delete-stream',
  JS_PURGE_STREAM: 'nats:js-purge-stream',
  JS_PUBLISH: 'nats:js-publish',
  JS_LIST_CONSUMERS: 'nats:js-list-consumers',
  JS_CREATE_CONSUMER: 'nats:js-create-consumer',
  JS_DELETE_CONSUMER: 'nats:js-delete-consumer',
  JS_BROWSE_MESSAGES: 'nats:js-browse-messages',
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
  LOADTEST_START: 'nats:loadtest-start',
  LOADTEST_STOP: 'nats:loadtest-stop',
  LOADTEST_PROGRESS: 'nats:loadtest-progress',
  DOCKER_LIST_CONTAINERS: 'docker:list-containers',
  DOCKER_CREATE_CONTAINER: 'docker:create-container',
  DOCKER_START_CONTAINER: 'docker:start-container',
  DOCKER_STOP_CONTAINER: 'docker:stop-container',
  DOCKER_RESTART_CONTAINER: 'docker:restart-container',
  DOCKER_REMOVE_CONTAINER: 'docker:remove-container',
  DOCKER_PULL_IMAGE: 'docker:pull-image',
  DOCKER_CONTAINER_LOGS: 'docker:container-logs',
  DOCKER_CONTAINER_LOGS_STREAM: 'docker:container-logs-stream',
  MONITOR_START: 'monitor:start',
  MONITOR_STOP: 'monitor:stop',
  MONITOR_METRICS: 'monitor:metrics',
  SAVE_CONNECTION_CONFIG: 'persist:save-connection',
  LOAD_CONNECTION_CONFIGS: 'persist:load-connections',
  DELETE_CONNECTION_CONFIG: 'persist:delete-connection',
  SAVE_LOAD_TEST_CONFIG: 'persist:save-loadtest',
  LOAD_LOAD_TEST_CONFIGS: 'persist:load-loadtests',
  DELETE_LOAD_TEST_CONFIG: 'persist:delete-loadtest',
  EXPORT_CONFIG: 'persist:export',
  IMPORT_CONFIG: 'persist:import',
};

const natsAPI = {
  // Connection
  connect: (config: any) => ipcRenderer.invoke(CHANNELS.CONNECT, config),
  disconnect: (connId: string) => ipcRenderer.invoke(CHANNELS.DISCONNECT, connId),
  getConnectionStatus: (connId: string) => ipcRenderer.invoke(CHANNELS.GET_CONNECTION_STATUS, connId),
  onConnectionStatusChange: (callback: (event: any, status: any) => void) => {
    const handler = (event: IpcRendererEvent, status: any) => callback(event, status);
    ipcRenderer.on(CHANNELS.CONNECTION_STATUS_CHANGED, handler);
    return () => ipcRenderer.removeListener(CHANNELS.CONNECTION_STATUS_CHANGED, handler);
  },
  
  // Pub/Sub
  publish: (args: any) => ipcRenderer.invoke(CHANNELS.PUBLISH, args),
  subscribe: (args: any) => ipcRenderer.invoke(CHANNELS.SUBSCRIBE, args),
  unsubscribe: (subId: string) => ipcRenderer.invoke(CHANNELS.UNSUBSCRIBE, subId),
  onMessage: (callback: (event: any, msg: any) => void) => {
    const handler = (event: IpcRendererEvent, msg: any) => callback(event, msg);
    ipcRenderer.on(CHANNELS.MESSAGE_RECEIVED, handler);
    return () => ipcRenderer.removeListener(CHANNELS.MESSAGE_RECEIVED, handler);
  },

  // Request-Reply
  request: (args: any) => ipcRenderer.invoke(CHANNELS.REQUEST, args),

  // JetStream flat
  createStream: (args: any) => ipcRenderer.invoke(CHANNELS.JS_CREATE_STREAM, args),
  listStreams: (connId: string) => ipcRenderer.invoke(CHANNELS.JS_LIST_STREAMS, connId),
  deleteStream: (args: any) => ipcRenderer.invoke(CHANNELS.JS_DELETE_STREAM, args),
  purgeStream: (args: any) => ipcRenderer.invoke(CHANNELS.JS_PURGE_STREAM, args),
  jsPublish: (args: any) => ipcRenderer.invoke(CHANNELS.JS_PUBLISH, args),
  listConsumers: (args: any) => ipcRenderer.invoke(CHANNELS.JS_LIST_CONSUMERS, args),
  createConsumer: (args: any) => ipcRenderer.invoke(CHANNELS.JS_CREATE_CONSUMER, args),
  deleteConsumer: (args: any) => ipcRenderer.invoke(CHANNELS.JS_DELETE_CONSUMER, args),
  browseMessages: (args: any) => ipcRenderer.invoke(CHANNELS.JS_BROWSE_MESSAGES, args),

  // JetStream namespace
  jetstream: {
    loadStreams: (connId: string) => ipcRenderer.invoke(CHANNELS.JS_LIST_STREAMS, connId),
    createStream: (connId: string, config: any) => ipcRenderer.invoke(CHANNELS.JS_CREATE_STREAM, { connId, config }),
    deleteStream: (connId: string, name: string) => ipcRenderer.invoke(CHANNELS.JS_DELETE_STREAM, { connId, name }),
    purgeStream: (connId: string, name: string) => ipcRenderer.invoke(CHANNELS.JS_PURGE_STREAM, { connId, name }),
    publish: (connId: string, subject: string, payload: any, headers?: any) => ipcRenderer.invoke(CHANNELS.JS_PUBLISH, { connId, subject, payload, headers }),
    loadConsumers: (connId: string, stream: string) => ipcRenderer.invoke(CHANNELS.JS_LIST_CONSUMERS, { connId, stream }),
    createConsumer: (connId: string, stream: string, config: any) => ipcRenderer.invoke(CHANNELS.JS_CREATE_CONSUMER, { connId, stream, config }),
    deleteConsumer: (connId: string, stream: string, name: string) => ipcRenderer.invoke(CHANNELS.JS_DELETE_CONSUMER, { connId, stream, name }),
    browseMessages: (connId: string, stream: string, opts: any) => ipcRenderer.invoke(CHANNELS.JS_BROWSE_MESSAGES, { connId, stream, opts }),
  },

  // KV flat
  listBuckets: (connId: string) => ipcRenderer.invoke(CHANNELS.KV_LIST_BUCKETS, connId),
  createBucket: (args: any) => ipcRenderer.invoke(CHANNELS.KV_CREATE_BUCKET, args),
  deleteBucket: (args: any) => ipcRenderer.invoke(CHANNELS.KV_DELETE_BUCKET, args),
  kvGet: (args: any) => ipcRenderer.invoke(CHANNELS.KV_GET, args),
  kvPut: (args: any) => ipcRenderer.invoke(CHANNELS.KV_PUT, args),
  kvDelete: (args: any) => ipcRenderer.invoke(CHANNELS.KV_DELETE, args),
  kvKeys: (args: any) => ipcRenderer.invoke(CHANNELS.KV_KEYS, args),
  kvHistory: (args: any) => ipcRenderer.invoke(CHANNELS.KV_HISTORY, args),
  kvWatch: (args: any) => ipcRenderer.invoke(CHANNELS.KV_WATCH, args),
  kvUnwatch: (args: any) => ipcRenderer.invoke(CHANNELS.KV_UNWATCH, args),
  onKvWatchUpdate: (callback: (event: any, update: any) => void) => {
    const handler = (event: IpcRendererEvent, update: any) => callback(event, update);
    ipcRenderer.on(CHANNELS.KV_WATCH_UPDATE, handler);
    return () => ipcRenderer.removeListener(CHANNELS.KV_WATCH_UPDATE, handler);
  },

  // KV namespace
  kv: {
    loadBuckets: (connId: string) => ipcRenderer.invoke(CHANNELS.KV_LIST_BUCKETS, connId),
    createBucket: (connId: string, name: string, opts?: any) => ipcRenderer.invoke(CHANNELS.KV_CREATE_BUCKET, { connId, name, opts }),
    deleteBucket: (connId: string, name: string) => ipcRenderer.invoke(CHANNELS.KV_DELETE_BUCKET, { connId, name }),
    getValue: (connId: string, bucket: string, key: string) => ipcRenderer.invoke(CHANNELS.KV_GET, { connId, bucket, key }),
    putValue: (connId: string, bucket: string, key: string, value: string) => ipcRenderer.invoke(CHANNELS.KV_PUT, { connId, bucket, key, value }),
    deleteKey: (connId: string, bucket: string, key: string) => ipcRenderer.invoke(CHANNELS.KV_DELETE, { connId, bucket, key }),
    loadKeys: (connId: string, bucket: string) => ipcRenderer.invoke(CHANNELS.KV_KEYS, { connId, bucket }),
    getHistory: (connId: string, bucket: string, key: string) => ipcRenderer.invoke(CHANNELS.KV_HISTORY, { connId, bucket, key }),
    startWatch: (connId: string, bucket: string, key?: string) => ipcRenderer.invoke(CHANNELS.KV_WATCH, { connId, bucket, key }),
    stopWatch: (watchId: string) => ipcRenderer.invoke(CHANNELS.KV_UNWATCH, watchId),
  },

  // Load Test flat & namespace
  startLoadTest: (args: any) => ipcRenderer.invoke(CHANNELS.LOADTEST_START, args),
  stopLoadTest: (testId: string) => ipcRenderer.invoke(CHANNELS.LOADTEST_STOP, testId),
  onLoadTestProgress: (callback: (event: any, progress: any) => void) => {
    const handler = (event: IpcRendererEvent, progress: any) => callback(event, progress);
    ipcRenderer.on(CHANNELS.LOADTEST_PROGRESS, handler);
    return () => ipcRenderer.removeListener(CHANNELS.LOADTEST_PROGRESS, handler);
  },
  loadTest: {
    loadConfigs: () => ipcRenderer.invoke(CHANNELS.LOAD_LOAD_TEST_CONFIGS),
    saveConfig: (config: any) => ipcRenderer.invoke(CHANNELS.SAVE_LOAD_TEST_CONFIG, config),
    deleteConfig: (id: string) => ipcRenderer.invoke(CHANNELS.DELETE_LOAD_TEST_CONFIG, id),
    startTest: (config: any) => ipcRenderer.invoke(CHANNELS.LOADTEST_START, config),
    stopTest: (testId: string) => ipcRenderer.invoke(CHANNELS.LOADTEST_STOP, testId),
  },

  // Docker flat & namespace
  listContainers: () => ipcRenderer.invoke(CHANNELS.DOCKER_LIST_CONTAINERS),
  createContainer: (args: any) => ipcRenderer.invoke(CHANNELS.DOCKER_CREATE_CONTAINER, args),
  startContainer: (id: string) => ipcRenderer.invoke(CHANNELS.DOCKER_START_CONTAINER, id),
  stopContainer: (id: string) => ipcRenderer.invoke(CHANNELS.DOCKER_STOP_CONTAINER, id),
  restartContainer: (id: string) => ipcRenderer.invoke(CHANNELS.DOCKER_RESTART_CONTAINER, id),
  removeContainer: (id: string) => ipcRenderer.invoke(CHANNELS.DOCKER_REMOVE_CONTAINER, id),
  pullImage: (image: string) => ipcRenderer.invoke(CHANNELS.DOCKER_PULL_IMAGE, image),
  containerLogs: (args: any) => ipcRenderer.invoke(CHANNELS.DOCKER_CONTAINER_LOGS, args),
  onContainerLogsStream: (callback: (event: any, log: any) => void) => {
    const handler = (event: IpcRendererEvent, log: any) => callback(event, log);
    ipcRenderer.on(CHANNELS.DOCKER_CONTAINER_LOGS_STREAM, handler);
    return () => ipcRenderer.removeListener(CHANNELS.DOCKER_CONTAINER_LOGS_STREAM, handler);
  },
  docker: {
    listContainers: () => ipcRenderer.invoke(CHANNELS.DOCKER_LIST_CONTAINERS),
    createContainer: (config: any) => ipcRenderer.invoke(CHANNELS.DOCKER_CREATE_CONTAINER, config),
    startContainer: (id: string) => ipcRenderer.invoke(CHANNELS.DOCKER_START_CONTAINER, id),
    stopContainer: (id: string) => ipcRenderer.invoke(CHANNELS.DOCKER_STOP_CONTAINER, id),
    restartContainer: (id: string) => ipcRenderer.invoke(CHANNELS.DOCKER_RESTART_CONTAINER, id),
    removeContainer: (id: string) => ipcRenderer.invoke(CHANNELS.DOCKER_REMOVE_CONTAINER, id),
    pullImage: (image: string) => ipcRenderer.invoke(CHANNELS.DOCKER_PULL_IMAGE, image),
    getContainerLogs: (id: string, tail?: number) => ipcRenderer.invoke(CHANNELS.DOCKER_CONTAINER_LOGS, { id, tail }),
  },

  // Monitoring flat & namespace
  startMonitor: (args: any) => ipcRenderer.invoke(CHANNELS.MONITOR_START, args),
  stopMonitor: (connId: string) => ipcRenderer.invoke(CHANNELS.MONITOR_STOP, connId),
  onMonitorMetrics: (callback: (event: any, metrics: any) => void) => {
    const handler = (event: IpcRendererEvent, metrics: any) => callback(event, metrics);
    ipcRenderer.on(CHANNELS.MONITOR_METRICS, handler);
    return () => ipcRenderer.removeListener(CHANNELS.MONITOR_METRICS, handler);
  },
  server: {
    startMonitoring: (monitorUrl: string, intervalMs: number) => ipcRenderer.invoke(CHANNELS.MONITOR_START, { monitorUrl, intervalMs }),
    stopMonitoring: (monitorUrl: string) => ipcRenderer.invoke(CHANNELS.MONITOR_STOP, monitorUrl),
  },

  // Persistence flat
  saveConnectionConfig: (config: any) => ipcRenderer.invoke(CHANNELS.SAVE_CONNECTION_CONFIG, config),
  saveConnectionConfigs: (configs: any[]) => ipcRenderer.invoke(CHANNELS.SAVE_CONNECTION_CONFIG, configs),
  loadConnectionConfigs: () => ipcRenderer.invoke(CHANNELS.LOAD_CONNECTION_CONFIGS),
  deleteConnectionConfig: (id: string) => ipcRenderer.invoke(CHANNELS.DELETE_CONNECTION_CONFIG, id),
  saveLoadTestConfig: (config: any) => ipcRenderer.invoke(CHANNELS.SAVE_LOAD_TEST_CONFIG, config),
  loadLoadTestConfigs: () => ipcRenderer.invoke(CHANNELS.LOAD_LOAD_TEST_CONFIGS),
  deleteLoadTestConfig: (id: string) => ipcRenderer.invoke(CHANNELS.DELETE_LOAD_TEST_CONFIG, id),
  exportConfig: (path: string) => ipcRenderer.invoke(CHANNELS.EXPORT_CONFIG, path),
  importConfig: (path: string) => ipcRenderer.invoke(CHANNELS.IMPORT_CONFIG, path),
};

try {
  contextBridge.exposeInMainWorld('natsAPI', natsAPI);
} catch (e) {
  console.warn('contextBridge failed, falling back to window.natsAPI assignment:', e);
  try {
    (window as any).natsAPI = natsAPI;
  } catch (err) {
    console.error('Failed to attach natsAPI to window:', err);
  }
}

export type NatsAPI = typeof natsAPI;

declare global {
  interface Window {
    natsAPI: NatsAPI;
  }
}
