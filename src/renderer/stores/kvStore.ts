import { create } from 'zustand';
import { KVBucketInfo, KVEntry } from '../../shared/types';

interface KVState {
  buckets: Record<string, KVBucketInfo[]>;
  keys: Record<string, string[]>;
  entries: Record<string, KVEntry>;
  watchUpdates: Record<string, KVEntry[]>;
  loading: boolean;
  
  loadBuckets: (connId: string) => Promise<void>;
  createBucket: (connId: string, name: string, opts?: any) => Promise<void>;
  deleteBucket: (connId: string, name: string) => Promise<void>;
  loadKeys: (connId: string, bucket: string) => Promise<void>;
  getValue: (connId: string, bucket: string, key: string) => Promise<void>;
  putValue: (connId: string, bucket: string, key: string, value: string) => Promise<void>;
  deleteKey: (connId: string, bucket: string, key: string) => Promise<void>;
  getHistory: (connId: string, bucket: string, key: string) => Promise<KVEntry[]>;
  startWatch: (connId: string, bucket: string, key?: string) => Promise<string>;
  stopWatch: (watchId: string) => Promise<void>;
  addWatchUpdate: (watchId: string, entry: KVEntry) => void;
}

export const useKVStore = create<KVState>((set, get) => ({
  buckets: {},
  keys: {},
  entries: {},
  watchUpdates: {},
  loading: false,

  loadBuckets: async (connId) => {
    set({ loading: true });
    try {
      const buckets = await (window as any).natsAPI.kv.loadBuckets(connId);
      set((state) => ({ buckets: { ...state.buckets, [connId]: buckets }, loading: false }));
    } catch (error) {
      console.error('Failed to load KV buckets:', error);
      set({ loading: false });
    }
  },

  createBucket: async (connId, name, opts) => {
    try {
      await (window as any).natsAPI.kv.createBucket(connId, name, opts);
      await get().loadBuckets(connId);
    } catch (error) {
      console.error('Failed to create KV bucket:', error);
      throw error;
    }
  },

  deleteBucket: async (connId, name) => {
    try {
      await (window as any).natsAPI.kv.deleteBucket(connId, name);
      await get().loadBuckets(connId);
    } catch (error) {
      console.error('Failed to delete KV bucket:', error);
      throw error;
    }
  },

  loadKeys: async (connId, bucket) => {
    try {
      const keys = await (window as any).natsAPI.kv.loadKeys(connId, bucket);
      const stateKey = `${connId}:${bucket}`;
      set((state) => ({ keys: { ...state.keys, [stateKey]: keys } }));
    } catch (error) {
      console.error('Failed to load KV keys:', error);
      throw error;
    }
  },

  getValue: async (connId, bucket, key) => {
    try {
      const entry = await (window as any).natsAPI.kv.getValue(connId, bucket, key);
      if (entry) {
        const stateKey = `${connId}:${bucket}:${key}`;
        set((state) => ({ entries: { ...state.entries, [stateKey]: entry } }));
      }
    } catch (error) {
      console.error('Failed to get KV value:', error);
      throw error;
    }
  },

  putValue: async (connId, bucket, key, value) => {
    try {
      await (window as any).natsAPI.kv.putValue(connId, bucket, key, value);
      await get().getValue(connId, bucket, key);
    } catch (error) {
      console.error('Failed to put KV value:', error);
      throw error;
    }
  },

  deleteKey: async (connId, bucket, key) => {
    try {
      await (window as any).natsAPI.kv.deleteKey(connId, bucket, key);
      const stateKey = `${connId}:${bucket}:${key}`;
      set((state) => {
        const copy = { ...state.entries };
        delete copy[stateKey];
        return { entries: copy };
      });
      await get().loadKeys(connId, bucket);
    } catch (error) {
      console.error('Failed to delete KV key:', error);
      throw error;
    }
  },

  getHistory: async (connId, bucket, key) => {
    try {
      return await (window as any).natsAPI.kv.getHistory(connId, bucket, key);
    } catch (error) {
      console.error('Failed to get KV history:', error);
      throw error;
    }
  },

  startWatch: async (connId, bucket, key) => {
    try {
      const watchId = await (window as any).natsAPI.kv.startWatch(connId, bucket, key);
      set((state) => ({ watchUpdates: { ...state.watchUpdates, [watchId]: [] } }));
      return watchId;
    } catch (error) {
      console.error('Failed to start KV watch:', error);
      throw error;
    }
  },

  stopWatch: async (watchId) => {
    try {
      await (window as any).natsAPI.kv.stopWatch(watchId);
      set((state) => {
        const copy = { ...state.watchUpdates };
        delete copy[watchId];
        return { watchUpdates: copy };
      });
    } catch (error) {
      console.error('Failed to stop KV watch:', error);
      throw error;
    }
  },

  addWatchUpdate: (watchId, entry) => {
    set((state) => {
      const updates = state.watchUpdates[watchId] || [];
      return {
        watchUpdates: { ...state.watchUpdates, [watchId]: [...updates, entry] }
      };
    });
  }
}));
