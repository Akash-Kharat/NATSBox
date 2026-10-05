import { create } from 'zustand';
import { ConnectionConfig, ConnectionInfo, ConnectionStatus } from '../../shared/types';
import { v4 as uuid } from 'uuid';
import { CONNECTION_DEFAULTS } from '../../shared/constants';

interface ConnectionState {
  connections: ConnectionConfig[];
  connectionStatuses: Record<string, ConnectionInfo>;
  activeConnectionId: string | null;
  loading: boolean;
  
  // Actions
  loadConnections: () => Promise<void>;
  addConnection: (config: Partial<ConnectionConfig>) => Promise<ConnectionConfig>;
  updateConnection: (id: string, config: Partial<ConnectionConfig>) => Promise<void>;
  deleteConnection: (id: string) => Promise<void>;
  connectToServer: (id: string) => Promise<void>;
  disconnectFromServer: (id: string) => Promise<void>;
  setActiveConnection: (id: string | null) => void;
  updateConnectionStatus: (id: string, info: ConnectionInfo) => void;
  addPublisher: (connId: string) => void;
  removePublisher: (connId: string, pubId: string) => void;
  updatePublisher: (connId: string, pubId: string, updates: any) => void;
  addSubscriber: (connId: string) => void;
  removeSubscriber: (connId: string, subId: string) => void;
  updateSubscriber: (connId: string, subId: string, updates: any) => void;
  connect: (id: string) => Promise<void>;
  disconnect: (id: string) => Promise<void>;
}

const safeStorage = {
  get: (key: string): string | null => {
    if (typeof localStorage !== 'undefined') {
      try { return localStorage.getItem(key); } catch {}
    }
    return null;
  },
  set: (key: string, value: string): void => {
    if (typeof localStorage !== 'undefined') {
      try { localStorage.setItem(key, value); } catch {}
    }
  }
};

export const useConnectionStore = create<ConnectionState>((set, get) => ({
  connections: [],
  connectionStatuses: {},
  activeConnectionId: null,
  loading: false,

  loadConnections: async () => {
    set({ loading: true });
    try {
      let connections = [];
      if (typeof window !== 'undefined' && (window as any).natsAPI?.loadConnectionConfigs) {
        connections = await (window as any).natsAPI.loadConnectionConfigs();
      } else {
        const local = safeStorage.get('natsbox_connections');
        connections = local ? JSON.parse(local) : [];
      }
      // Reset subscription status on app load since backend IPC state is reset
      const resetConns = (connections || []).map((conn: any) => ({
        ...conn,
        subscribers: (conn.subscribers || []).map((sub: any) => ({ ...sub, isSubscribed: false }))
      }));
      set({ connections: resetConns, loading: false });
    } catch (error) {
      console.error('Failed to load connections:', error);
      const local = safeStorage.get('natsbox_connections');
      const connections = local ? JSON.parse(local) : [];
      const resetConns = (connections || []).map((conn: any) => ({
        ...conn,
        subscribers: (conn.subscribers || []).map((sub: any) => ({ ...sub, isSubscribed: false }))
      }));
      set({ connections: resetConns, loading: false });
    }
  },

  addConnection: async (config) => {
    const newConfig: ConnectionConfig = {
      ...CONNECTION_DEFAULTS,
      id: uuid(),
      name: config.name || 'New Connection',
      ...config,
      publishers: config.publishers || [],
      subscribers: config.subscribers || []
    };
    try {
      const current = get().connections;
      const updated = [...current, newConfig];
      if (typeof window !== 'undefined' && (window as any).natsAPI?.saveConnectionConfigs) {
        await (window as any).natsAPI.saveConnectionConfigs(updated);
      }
      safeStorage.set('natsbox_connections', JSON.stringify(updated));
      set({ connections: updated });
      return newConfig;
    } catch (error) {
      console.error('Failed to add connection:', error);
      const current = get().connections;
      const updated = [...current, newConfig];
      safeStorage.set('natsbox_connections', JSON.stringify(updated));
      set({ connections: updated });
      return newConfig;
    }
  },

  updateConnection: async (id, config) => {
    try {
      const current = get().connections;
      const updated = current.map(c => c.id === id ? { ...c, ...config } : c);
      if (typeof window !== 'undefined' && (window as any).natsAPI?.saveConnectionConfigs) {
        await (window as any).natsAPI.saveConnectionConfigs(updated);
      }
      safeStorage.set('natsbox_connections', JSON.stringify(updated));
      set({ connections: updated });
    } catch (error) {
      console.error('Failed to update connection:', error);
      const current = get().connections;
      const updated = current.map(c => c.id === id ? { ...c, ...config } : c);
      safeStorage.set('natsbox_connections', JSON.stringify(updated));
      set({ connections: updated });
    }
  },

  deleteConnection: async (id) => {
    try {
      const current = get().connections;
      const updated = current.filter(c => c.id !== id);
      if (typeof window !== 'undefined' && (window as any).natsAPI?.saveConnectionConfigs) {
        await (window as any).natsAPI.saveConnectionConfigs(updated);
      }
      safeStorage.set('natsbox_connections', JSON.stringify(updated));
      set({ connections: updated });
      if (get().activeConnectionId === id) {
        set({ activeConnectionId: null });
      }
    } catch (error) {
      console.error('Failed to delete connection:', error);
      const current = get().connections;
      const updated = current.filter(c => c.id !== id);
      safeStorage.set('natsbox_connections', JSON.stringify(updated));
      set({ connections: updated });
    }
  },

  connectToServer: async (id) => {
    set((state) => ({
      connectionStatuses: {
        ...state.connectionStatuses,
        [id]: { id, status: 'connecting' }
      }
    }));
    try {
      const connection = get().connections.find(c => c.id === id);
      if (!connection) throw new Error('Connection not found');
      
      let info: ConnectionInfo | null = null;
      if (typeof window !== 'undefined' && (window as any).natsAPI?.connect) {
        info = await (window as any).natsAPI.connect(connection);
      } else {
        throw new Error('NATS API is not available (running outside Electron?)');
      }

      set((state) => ({
        connectionStatuses: {
          ...state.connectionStatuses,
          [id]: info || { id, status: 'connected' }
        }
      }));
    } catch (error: any) {
      console.error('Failed to connect:', error);
      set((state) => ({
        connectionStatuses: {
          ...state.connectionStatuses,
          [id]: { id, status: 'error', error: error?.message || 'Connection failed' }
        }
      }));
      throw error;
    }
  },

  disconnectFromServer: async (id) => {
    try {
      if (typeof window !== 'undefined' && (window as any).natsAPI?.disconnect) {
        await (window as any).natsAPI.disconnect(id);
      }
      set((state) => ({
        connectionStatuses: {
          ...state.connectionStatuses,
          [id]: { id, status: 'disconnected' }
        }
      }));
    } catch (error) {
      console.error('Failed to disconnect:', error);
      set((state) => ({
        connectionStatuses: {
          ...state.connectionStatuses,
          [id]: { id, status: 'disconnected' }
        }
      }));
      throw error;
    }
  },

  setActiveConnection: (id) => {
    set({ activeConnectionId: id });
  },

  updateConnectionStatus: (id, info) => {
    set((state) => ({
      connectionStatuses: {
        ...state.connectionStatuses,
        [id]: info
      }
    }));
  },

  addPublisher: (connId) => {
    const pubId = uuid();
    const current = get().connections;
    const updated = current.map(c => {
      if (c.id === connId) {
        return {
          ...c,
          publishers: [...(c.publishers || []), { id: pubId, subject: '', payload: '', payloadType: 'json' }]
        };
      }
      return c;
    });
    set({ connections: updated });
    (window as any).natsAPI.saveConnectionConfigs(updated).catch(console.error);
  },

  removePublisher: (connId, pubId) => {
    const current = get().connections;
    const updated = current.map(c => {
      if (c.id === connId) {
        return {
          ...c,
          publishers: (c.publishers || []).filter((p: any) => p.id !== pubId)
        };
      }
      return c;
    });
    set({ connections: updated });
    (window as any).natsAPI.saveConnectionConfigs(updated).catch(console.error);
  },

  updatePublisher: (connId, pubId, updates) => {
    const current = get().connections;
    const updated = current.map(c => {
      if (c.id === connId) {
        return {
          ...c,
          publishers: (c.publishers || []).map((p: any) => p.id === pubId ? { ...p, ...updates } : p)
        };
      }
      return c;
    });
    set({ connections: updated });
    (window as any).natsAPI.saveConnectionConfigs(updated).catch(console.error);
  },

  addSubscriber: (connId) => {
    const subId = uuid();
    const current = get().connections;
    const updated = current.map(c => {
      if (c.id === connId) {
        return {
          ...c,
          subscribers: [...(c.subscribers || []), { id: subId, subject: '', active: false }]
        };
      }
      return c;
    });
    set({ connections: updated });
    (window as any).natsAPI.saveConnectionConfigs(updated).catch(console.error);
  },

  removeSubscriber: (connId, subId) => {
    const current = get().connections;
    const updated = current.map(c => {
      if (c.id === connId) {
        return {
          ...c,
          subscribers: (c.subscribers || []).filter((s: any) => s.id !== subId)
        };
      }
      return c;
    });
    set({ connections: updated });
    (window as any).natsAPI.saveConnectionConfigs(updated).catch(console.error);
  },

  updateSubscriber: (connId, subId, updates) => {
    const current = get().connections;
    const updated = current.map(c => {
      if (c.id === connId) {
        return {
          ...c,
          subscribers: (c.subscribers || []).map((s: any) => s.id === subId ? { ...s, ...updates } : s)
        };
      }
      return c;
    });
    set({ connections: updated });
    (window as any).natsAPI.saveConnectionConfigs(updated).catch(console.error);
  },

  connect: async (id: string) => {
    return get().connectToServer(id);
  },

  disconnect: async (id: string) => {
    return get().disconnectFromServer(id);
  }
}));
