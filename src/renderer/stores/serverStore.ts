import { create } from 'zustand';
import { DockerContainer, ServerMetrics, NatsServerConfig } from '../../shared/types';

interface ServerState {
  containers: DockerContainer[];
  serverMetrics: Record<string, ServerMetrics>;
  containerLogs: Record<string, string[]>;
  monitoring: Record<string, boolean>;
  loading: boolean;
  dockerAvailable: boolean;
  
  loadContainers: () => Promise<void>;
  createContainer: (config: NatsServerConfig) => Promise<void>;
  startContainer: (id: string) => Promise<void>;
  stopContainer: (id: string) => Promise<void>;
  restartContainer: (id: string) => Promise<void>;
  removeContainer: (id: string) => Promise<void>;
  pullImage: (tag: string) => Promise<void>;
  getContainerLogs: (id: string) => Promise<void>;
  addContainerLog: (id: string, log: string) => void;
  startMonitoring: (monitorUrl: string, intervalMs: number) => Promise<void>;
  stopMonitoring: (monitorUrl: string) => Promise<void>;
  updateMetrics: (url: string, metrics: ServerMetrics) => void;
  // Aliases for component compatibility
  fetchContainers: () => Promise<void>;
  getLogs: (id: string) => Promise<string>;
  latestMetrics?: ServerMetrics;
}

export const useServerStore = create<ServerState>((set, get) => ({
  containers: [],
  serverMetrics: {},
  containerLogs: {},
  monitoring: {},
  loading: false,
  dockerAvailable: false,

  loadContainers: async () => {
    set({ loading: true });
    try {
      const containers = await (window as any).natsAPI.docker.listContainers();
      set({ containers, dockerAvailable: true, loading: false });
    } catch (error) {
      console.error('Failed to load containers:', error);
      set({ dockerAvailable: false, loading: false });
    }
  },

  createContainer: async (config) => {
    try {
      await (window as any).natsAPI.docker.createContainer(config);
      await get().loadContainers();
    } catch (error) {
      console.error('Failed to create container:', error);
      throw error;
    }
  },

  startContainer: async (id) => {
    try {
      await (window as any).natsAPI.docker.startContainer(id);
      await get().loadContainers();
    } catch (error) {
      console.error('Failed to start container:', error);
      throw error;
    }
  },

  stopContainer: async (id) => {
    try {
      await (window as any).natsAPI.docker.stopContainer(id);
      await get().loadContainers();
    } catch (error) {
      console.error('Failed to stop container:', error);
      throw error;
    }
  },

  restartContainer: async (id) => {
    try {
      await (window as any).natsAPI.docker.restartContainer(id);
      await get().loadContainers();
    } catch (error) {
      console.error('Failed to restart container:', error);
      throw error;
    }
  },

  removeContainer: async (id) => {
    try {
      await (window as any).natsAPI.docker.removeContainer(id);
      await get().loadContainers();
    } catch (error) {
      console.error('Failed to remove container:', error);
      throw error;
    }
  },

  pullImage: async (tag) => {
    try {
      await (window as any).natsAPI.docker.pullImage(tag);
    } catch (error) {
      console.error('Failed to pull image:', error);
      throw error;
    }
  },

  getContainerLogs: async (id) => {
    try {
      const logs = await (window as any).natsAPI.docker.getContainerLogs(id);
      set((state) => ({ containerLogs: { ...state.containerLogs, [id]: logs } }));
    } catch (error) {
      console.error('Failed to get container logs:', error);
      throw error;
    }
  },

  addContainerLog: (id, log) => {
    set((state) => {
      const logs = state.containerLogs[id] || [];
      return { containerLogs: { ...state.containerLogs, [id]: [...logs, log].slice(-1000) } };
    });
  },

  startMonitoring: async (monitorUrl, intervalMs) => {
    try {
      await (window as any).natsAPI.server.startMonitoring(monitorUrl, intervalMs);
      set((state) => ({ monitoring: { ...state.monitoring, [monitorUrl]: true } }));
    } catch (error) {
      console.error('Failed to start monitoring:', error);
      throw error;
    }
  },

  stopMonitoring: async (monitorUrl) => {
    try {
      await (window as any).natsAPI.server.stopMonitoring(monitorUrl);
      set((state) => {
        const copy = { ...state.monitoring };
        delete copy[monitorUrl];
        return { monitoring: copy };
      });
    } catch (error) {
      console.error('Failed to stop monitoring:', error);
      throw error;
    }
  },

  updateMetrics: (url, metrics) => {
    set((state) => ({ 
      serverMetrics: { ...state.serverMetrics, [url]: metrics },
      latestMetrics: metrics
    }));
  },

  fetchContainers: async () => {
    return get().loadContainers();
  },

  getLogs: async (id: string) => {
    try {
      const logs = await (window as any).natsAPI.docker.getContainerLogs(id);
      return Array.isArray(logs) ? logs.join('\n') : String(logs || '');
    } catch {
      return '';
    }
  }
}));
