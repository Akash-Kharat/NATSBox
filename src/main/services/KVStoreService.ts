import { NatsConnection, StringCodec, KV } from 'nats';
import { KVEntry, KVBucketInfo } from '../../shared/types';
import { BrowserWindow } from 'electron';
import { IPC_CHANNELS } from '../../shared/constants';
import { v4 as uuid } from 'uuid';

class KVStoreService {
  private sc = StringCodec();
  private activeWatches: Map<string, { stop: () => void }> = new Map();
  private mainWindow: BrowserWindow | null = null;

  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  async listBuckets(nc: NatsConnection): Promise<KVBucketInfo[]> {
    const jsm = await nc.jetstreamManager();
    const streams = await jsm.streams.list().next();
    
    return streams
      .filter(s => s.config.name.startsWith('KV_'))
      .map(s => {
        const bucket = s.config.name.substring(3);
        return {
          bucket,
          history: s.config.max_msgs_per_subject,
          ttl: s.config.max_age,
          storage: (String(s.config.storage).toLowerCase() === 'memory' || (s.config.storage as any) === 1) ? 'memory' : 'file',
          replicas: s.config.num_replicas,
          values: s.state.messages,
          bytes: s.state.bytes
        };
      });
  }

  async createBucket(nc: NatsConnection, name: string, opts?: { history?: number; ttl?: number; storage?: string; replicas?: number }): Promise<void> {
    const js = nc.jetstream();
    await js.views.kv(name, {
      history: opts?.history,
      ttl: opts?.ttl,
      storage: opts?.storage?.toLowerCase() === 'memory' ? 1 : 0,
      replicas: opts?.replicas
    } as any);
  }

  async deleteBucket(nc: NatsConnection, name: string): Promise<void> {
    const js = nc.jetstream();
    const kv = await js.views.kv(name);
    await kv.destroy();
  }

  async get(nc: NatsConnection, bucket: string, key: string): Promise<KVEntry | null> {
    const js = nc.jetstream();
    const kv = await js.views.kv(bucket);
    const entry = await kv.get(key);
    if (!entry) return null;
    return {
      bucket,
      key: entry.key,
      value: this.sc.decode(entry.value),
      revision: entry.revision,
      created: entry.created.toISOString(),
      operation: (entry.operation || 'PUT') as 'PUT' | 'DEL' | 'PURGE'
    };
  }

  async put(nc: NatsConnection, bucket: string, key: string, value: string): Promise<number> {
    const js = nc.jetstream();
    const kv = await js.views.kv(bucket);
    const seq = await kv.put(key, this.sc.encode(value));
    return seq;
  }

  async delete(nc: NatsConnection, bucket: string, key: string): Promise<void> {
    const js = nc.jetstream();
    const kv = await js.views.kv(bucket);
    await kv.delete(key);
  }

  async keys(nc: NatsConnection, bucket: string): Promise<string[]> {
    const js = nc.jetstream();
    const kv = await js.views.kv(bucket);
    const keysIter = await kv.keys();
    const keys: string[] = [];
    for await (const k of keysIter) {
      keys.push(k);
    }
    return keys;
  }

  async history(nc: NatsConnection, bucket: string, key: string): Promise<KVEntry[]> {
    const js = nc.jetstream();
    const kv = await js.views.kv(bucket);
    const historyIter = await kv.history({ key });
    
    const entries: KVEntry[] = [];
    for await (const entry of historyIter) {
      if (entry) {
        entries.push({
          bucket,
          key: entry.key,
          value: entry.value ? this.sc.decode(entry.value) : '',
          revision: entry.revision,
          created: entry.created.toISOString(),
          operation: (entry.operation || 'PUT') as 'PUT' | 'DEL' | 'PURGE'
        });
      }
    }
    return entries;
  }

  async watch(nc: NatsConnection, bucket: string, key?: string): Promise<string> {
    const watchId = uuid();
    const kv = await nc.jetstream().views.kv(bucket);
    const watch = await kv.watch({ key: key || '>' });
    
    this.activeWatches.set(watchId, { stop: () => watch.stop() });
    
    (async () => {
      try {
        for await (const entry of watch) {
          if (this.mainWindow && entry) {
            this.mainWindow.webContents.send(IPC_CHANNELS.KV_WATCH_UPDATE, {
              watchId,
              entry: {
                bucket,
                key: entry.key,
                value: entry.value ? this.sc.decode(entry.value) : '',
                revision: entry.revision,
                created: entry.created.toISOString(),
                operation: (entry.operation || 'PUT') as 'PUT' | 'DEL' | 'PURGE'
              }
            });
          }
        }
      } catch (e) {
        console.error('Watch error:', e);
      }
    })();
    
    return watchId;
  }

  async unwatch(watchId: string): Promise<void> {
    const w = this.activeWatches.get(watchId);
    if (w) {
      w.stop();
      this.activeWatches.delete(watchId);
    }
  }

  stopAll(): void {
    for (const [id, w] of this.activeWatches) {
      w.stop();
      this.activeWatches.delete(id);
    }
  }
}

export const kvStoreService = new KVStoreService();
export default kvStoreService;
