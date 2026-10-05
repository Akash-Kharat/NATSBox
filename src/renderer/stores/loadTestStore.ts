import { create } from 'zustand';
import { LoadTestConfig, LoadTestProgress } from '../../shared/types';

interface LoadTestState {
  configs: LoadTestConfig[];
  activeTests: Record<string, LoadTestProgress>;
  loading: boolean;
  
  loadConfigs: () => Promise<void>;
  saveConfig: (config: LoadTestConfig) => Promise<void>;
  deleteConfig: (id: string) => Promise<void>;
  startTest: (config: LoadTestConfig) => Promise<string>;
  stopTest: (testId: string) => Promise<void>;
  updateProgress: (progress: LoadTestProgress) => void;
}

export const useLoadTestStore = create<LoadTestState>((set, get) => ({
  configs: [],
  activeTests: {},
  loading: false,

  loadConfigs: async () => {
    set({ loading: true });
    try {
      const configs = await (window as any).natsAPI.loadTest.loadConfigs();
      set({ configs, loading: false });
    } catch (error) {
      console.error('Failed to load load test configs:', error);
      set({ loading: false });
    }
  },

  saveConfig: async (config) => {
    try {
      await (window as any).natsAPI.loadTest.saveConfig(config);
      await get().loadConfigs();
    } catch (error) {
      console.error('Failed to save load test config:', error);
      throw error;
    }
  },

  deleteConfig: async (id) => {
    try {
      await (window as any).natsAPI.loadTest.deleteConfig(id);
      await get().loadConfigs();
    } catch (error) {
      console.error('Failed to delete load test config:', error);
      throw error;
    }
  },

  startTest: async (config) => {
    try {
      const testId = await (window as any).natsAPI.loadTest.startTest(config);
      set((state) => ({
        activeTests: {
          ...state.activeTests,
          [testId]: { testId, status: 'running', sent: 0, received: 0, errors: 0 }
        }
      }));
      return testId;
    } catch (error) {
      console.error('Failed to start load test:', error);
      throw error;
    }
  },

  stopTest: async (testId) => {
    try {
      await (window as any).natsAPI.loadTest.stopTest(testId);
    } catch (error) {
      console.error('Failed to stop load test:', error);
      throw error;
    }
  },

  updateProgress: (progress) => {
    set((state) => ({
      activeTests: { ...state.activeTests, [progress.testId]: progress }
    }));
  }
}));
