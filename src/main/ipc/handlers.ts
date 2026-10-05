import { ipcMain, BrowserWindow } from 'electron';
import { IPC_CHANNELS } from '../../shared/constants';
import { natsManager } from '../services/NatsConnectionManager';
import { jetStreamService } from '../services/JetStreamService';
import { kvStoreService } from '../services/KVStoreService';
import { loadTestService } from '../services/LoadTestService';
import { dockerService } from '../services/DockerService';
import { monitoringService } from '../services/NatsMonitoringService';
import { persistenceService } from '../services/PersistenceService';

export function registerIpcHandlers(mainWindow: BrowserWindow) {
  // Set main window references where needed
  kvStoreService.setMainWindow(mainWindow);
  loadTestService.setMainWindow(mainWindow);
  monitoringService.setMainWindow(mainWindow);

  // 1. Connection Handlers
  ipcMain.handle(IPC_CHANNELS.CONNECTION.CONNECT, async (_, config) => {
    return await natsManager.connect(config);
  });
  
  ipcMain.handle(IPC_CHANNELS.CONNECTION.DISCONNECT, async (_, connId: string) => {
    await natsManager.disconnect(connId);
    return true;
  });
  
  ipcMain.handle(IPC_CHANNELS.CONNECTION.GET_STATUS, (_, connId: string) => {
    return natsManager.getStatus(connId);
  });

  natsManager.on('statusChanged', (data) => {
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send(IPC_CHANNELS.CONNECTION.STATUS_CHANGED, data);
    }
  });

  // 2. Pub/Sub Handlers
  ipcMain.handle(IPC_CHANNELS.PUB_SUB.PUBLISH, async (_, args: any) => {
    natsManager.publish(args);
    return true;
  });
  
  ipcMain.handle(IPC_CHANNELS.PUB_SUB.SUBSCRIBE, async (_, args: any) => {
    return await natsManager.subscribe(args, (msg: any) => {
      if (!mainWindow.isDestroyed()) {
        mainWindow.webContents.send(IPC_CHANNELS.PUB_SUB.MESSAGE_RECEIVED, msg);
      }
    });
  });
  
  ipcMain.handle(IPC_CHANNELS.PUB_SUB.UNSUBSCRIBE, async (_, args: any) => {
    const subId = typeof args === 'string' ? args : (args?.subId || args?.id);
    await natsManager.unsubscribe(subId);
    return true;
  });

  // 3. Request-Reply Handlers
  ipcMain.handle(IPC_CHANNELS.REQUEST_REPLY.REQUEST, async (_, args: any) => {
    return await natsManager.request(args);
  });

  const getNC = (arg: any) => {
    const id = typeof arg === 'string' ? arg : (arg?.connId || arg?.connectionId || arg?.id);
    return id ? natsManager.getConnection(id) : undefined;
  };

  // 4. JetStream Handlers
  ipcMain.handle(IPC_CHANNELS.JETSTREAM.CREATE_STREAM, async (_, args: any) => {
    const nc = getNC(args);
    if (!nc) throw new Error('Connection not found');
    return await jetStreamService.createStream(nc, args.config);
  });

  ipcMain.handle(IPC_CHANNELS.JETSTREAM.LIST_STREAMS, async (_, args: any) => {
    const nc = getNC(args);
    if (!nc) throw new Error('Connection not found');
    return await jetStreamService.listStreams(nc);
  });

  ipcMain.handle(IPC_CHANNELS.JETSTREAM.DELETE_STREAM, async (_, args: any) => {
    const nc = getNC(args);
    if (!nc) throw new Error('Connection not found');
    return await jetStreamService.deleteStream(nc, args.name);
  });

  ipcMain.handle(IPC_CHANNELS.JETSTREAM.PURGE_STREAM, async (_, args: any) => {
    const nc = getNC(args);
    if (!nc) throw new Error('Connection not found');
    return await jetStreamService.purgeStream(nc, args.name);
  });

  ipcMain.handle(IPC_CHANNELS.JETSTREAM.PUBLISH, async (_, args: any) => {
    const nc = getNC(args);
    if (!nc) throw new Error('Connection not found');
    return await jetStreamService.publish(nc, args.subject, args.payload, args.headers);
  });

  ipcMain.handle(IPC_CHANNELS.JETSTREAM.LIST_CONSUMERS, async (_, args: any) => {
    const nc = getNC(args);
    if (!nc) throw new Error('Connection not found');
    return await jetStreamService.listConsumers(nc, args.stream);
  });

  ipcMain.handle(IPC_CHANNELS.JETSTREAM.CREATE_CONSUMER, async (_, args: any) => {
    const nc = getNC(args);
    if (!nc) throw new Error('Connection not found');
    return await jetStreamService.createConsumer(nc, args.stream, args.config);
  });

  ipcMain.handle(IPC_CHANNELS.JETSTREAM.DELETE_CONSUMER, async (_, args: any) => {
    const nc = getNC(args);
    if (!nc) throw new Error('Connection not found');
    return await jetStreamService.deleteConsumer(nc, args.stream, args.name);
  });

  ipcMain.handle(IPC_CHANNELS.JETSTREAM.BROWSE_MESSAGES, async (_, args: any) => {
    const nc = getNC(args);
    if (!nc) throw new Error('Connection not found');
    return await jetStreamService.browseMessages(nc, args.stream, args.opts);
  });

  // 5. KV Store Handlers
  ipcMain.handle(IPC_CHANNELS.KV.LIST_BUCKETS, async (_, args: any) => {
    const nc = getNC(args);
    if (!nc) throw new Error('Connection not found');
    return await kvStoreService.listBuckets(nc);
  });

  ipcMain.handle(IPC_CHANNELS.KV.CREATE_BUCKET, async (_, args: any) => {
    const nc = getNC(args);
    if (!nc) throw new Error('Connection not found');
    return await kvStoreService.createBucket(nc, args.name, args.opts);
  });

  ipcMain.handle(IPC_CHANNELS.KV.DELETE_BUCKET, async (_, args: any) => {
    const nc = getNC(args);
    if (!nc) throw new Error('Connection not found');
    return await kvStoreService.deleteBucket(nc, args.name);
  });

  ipcMain.handle(IPC_CHANNELS.KV.GET, async (_, args: any) => {
    const nc = getNC(args);
    if (!nc) throw new Error('Connection not found');
    return await kvStoreService.get(nc, args.bucket, args.key);
  });

  ipcMain.handle(IPC_CHANNELS.KV.PUT, async (_, args: any) => {
    const nc = getNC(args);
    if (!nc) throw new Error('Connection not found');
    return await kvStoreService.put(nc, args.bucket, args.key, args.value);
  });

  ipcMain.handle(IPC_CHANNELS.KV.DELETE, async (_, args: any) => {
    const nc = getNC(args);
    if (!nc) throw new Error('Connection not found');
    return await kvStoreService.delete(nc, args.bucket, args.key);
  });

  ipcMain.handle(IPC_CHANNELS.KV.KEYS, async (_, args: any) => {
    const nc = getNC(args);
    if (!nc) throw new Error('Connection not found');
    return await kvStoreService.keys(nc, args.bucket);
  });

  ipcMain.handle(IPC_CHANNELS.KV.HISTORY, async (_, args: any) => {
    const nc = getNC(args);
    if (!nc) throw new Error('Connection not found');
    return await kvStoreService.history(nc, args.bucket, args.key);
  });

  ipcMain.handle(IPC_CHANNELS.KV.WATCH, async (_, args: any) => {
    const nc = getNC(args);
    if (!nc) throw new Error('Connection not found');
    return await kvStoreService.watch(nc, args.bucket, args.key);
  });

  ipcMain.handle(IPC_CHANNELS.KV.UNWATCH, async (_, args: any) => {
    const watchId = typeof args === 'string' ? args : args.watchId;
    return await kvStoreService.unwatch(watchId);
  });

  // 6. Load Test Handlers
  ipcMain.handle(IPC_CHANNELS.LOAD_TEST.START, async (_, config: any) => {
    const nc = natsManager.getConnection(config.connectionId);
    if (!nc) throw new Error('Connection not found for load test');
    return await loadTestService.startTest(nc, config);
  });

  ipcMain.handle(IPC_CHANNELS.LOAD_TEST.STOP, async (_, testId: string) => {
    return await loadTestService.stopTest(testId);
  });

  // 7. Docker Handlers
  ipcMain.handle(IPC_CHANNELS.DOCKER.LIST_CONTAINERS, async () => {
    return await dockerService.listNatsContainers();
  });

  ipcMain.handle(IPC_CHANNELS.DOCKER.CREATE_CONTAINER, async (_, config: any) => {
    return await dockerService.createNatsContainer(config);
  });

  ipcMain.handle(IPC_CHANNELS.DOCKER.START_CONTAINER, async (_, id: string) => {
    return await dockerService.startContainer(id);
  });

  ipcMain.handle(IPC_CHANNELS.DOCKER.STOP_CONTAINER, async (_, id: string) => {
    return await dockerService.stopContainer(id);
  });

  ipcMain.handle(IPC_CHANNELS.DOCKER.RESTART_CONTAINER, async (_, id: string) => {
    return await dockerService.restartContainer(id);
  });

  ipcMain.handle(IPC_CHANNELS.DOCKER.REMOVE_CONTAINER, async (_, id: string) => {
    return await dockerService.removeContainer(id);
  });

  ipcMain.handle(IPC_CHANNELS.DOCKER.PULL_IMAGE, async (_, image: string) => {
    return await dockerService.pullImage(image);
  });

  ipcMain.handle(IPC_CHANNELS.DOCKER.LOGS, async (_, { id, tail }: any) => {
    return await dockerService.getContainerLogs(id, tail);
  });

  // 8. Server Monitoring Handlers
  ipcMain.handle(IPC_CHANNELS.MONITORING.START, async (_, { monitorUrl, intervalMs }: any) => {
    return await monitoringService.startMonitoring(monitorUrl, intervalMs);
  });

  ipcMain.handle(IPC_CHANNELS.MONITORING.STOP, async (_, monitorUrl: string) => {
    return await monitoringService.stopMonitoring(monitorUrl);
  });

  // 9. Persistence Handlers
  ipcMain.handle(IPC_CHANNELS.PERSISTENCE.SAVE_CONNECTION_CONFIG, async (_, config: any) => {
    if (Array.isArray(config)) {
      persistenceService.saveAllConnections(config);
    } else {
      persistenceService.saveConnection(config);
    }
    return true;
  });

  ipcMain.handle(IPC_CHANNELS.PERSISTENCE.LOAD_CONNECTION_CONFIGS, async () => {
    return persistenceService.getConnections();
  });

  ipcMain.handle(IPC_CHANNELS.PERSISTENCE.DELETE_CONNECTION_CONFIG, async (_, id: string) => {
    persistenceService.deleteConnection(id);
    return true;
  });

  ipcMain.handle(IPC_CHANNELS.PERSISTENCE.SAVE_LOAD_TEST_CONFIG, async (_, config: any) => {
    persistenceService.saveLoadTest(config);
    return true;
  });

  ipcMain.handle(IPC_CHANNELS.PERSISTENCE.LOAD_LOAD_TEST_CONFIGS, async () => {
    return persistenceService.getLoadTests();
  });

  ipcMain.handle(IPC_CHANNELS.PERSISTENCE.DELETE_LOAD_TEST_CONFIG, async (_, id: string) => {
    persistenceService.deleteLoadTest(id);
    return true;
  });

  ipcMain.handle(IPC_CHANNELS.PERSISTENCE.EXPORT_CONFIG, async () => {
    return persistenceService.exportAll();
  });

  ipcMain.handle(IPC_CHANNELS.PERSISTENCE.IMPORT_CONFIG, async (_, data: string) => {
    persistenceService.importAll(data);
    return true;
  });
}
