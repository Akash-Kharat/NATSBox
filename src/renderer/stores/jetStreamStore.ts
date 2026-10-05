import { create } from 'zustand';
import { StreamInfo, StreamConfig, ConsumerInfo, ConsumerConfig, StoredMessage, BrowseMessagesOptions } from '../../shared/types';

interface JetStreamState {
  streams: Record<string, StreamInfo[]>;
  consumers: Record<string, ConsumerInfo[]>;
  storedMessages: Record<string, StoredMessage[]>;
  loading: boolean;
  
  loadStreams: (connId: string) => Promise<void>;
  createStream: (connId: string, config: StreamConfig) => Promise<void>;
  deleteStream: (connId: string, name: string) => Promise<void>;
  purgeStream: (connId: string, name: string) => Promise<void>;
  loadConsumers: (connId: string, stream: string) => Promise<void>;
  createConsumer: (connId: string, stream: string, config: ConsumerConfig) => Promise<void>;
  deleteConsumer: (connId: string, stream: string, name: string) => Promise<void>;
  browseMessages: (connId: string, stream: string, opts: BrowseMessagesOptions) => Promise<StoredMessage[]>;
  fetchStreams: (connId: string) => Promise<void>;
  fetchConsumers: (connId: string, stream: string) => Promise<ConsumerInfo[]>;
}

export const useJetStreamStore = create<JetStreamState>((set, get) => ({
  streams: {},
  consumers: {},
  storedMessages: {},
  loading: false,

  loadStreams: async (connId) => {
    set({ loading: true });
    try {
      const streams = await (window as any).natsAPI.jetstream.loadStreams(connId);
      set((state) => ({ streams: { ...state.streams, [connId]: streams }, loading: false }));
    } catch (error) {
      console.error('Failed to load streams:', error);
      set({ loading: false });
    }
  },

  createStream: async (connId, config) => {
    try {
      await (window as any).natsAPI.jetstream.createStream(connId, config);
      await get().loadStreams(connId);
    } catch (error) {
      console.error('Failed to create stream:', error);
      throw error;
    }
  },

  deleteStream: async (connId, name) => {
    try {
      await (window as any).natsAPI.jetstream.deleteStream(connId, name);
      await get().loadStreams(connId);
    } catch (error) {
      console.error('Failed to delete stream:', error);
      throw error;
    }
  },

  purgeStream: async (connId, name) => {
    try {
      await (window as any).natsAPI.jetstream.purgeStream(connId, name);
      await get().loadStreams(connId);
    } catch (error) {
      console.error('Failed to purge stream:', error);
      throw error;
    }
  },

  loadConsumers: async (connId, stream) => {
    try {
      const consumers = await (window as any).natsAPI.jetstream.loadConsumers(connId, stream);
      const key = `${connId}:${stream}`;
      set((state) => ({ consumers: { ...state.consumers, [key]: consumers } }));
    } catch (error) {
      console.error('Failed to load consumers:', error);
      throw error;
    }
  },

  createConsumer: async (connId, stream, config) => {
    try {
      await (window as any).natsAPI.jetstream.createConsumer(connId, stream, config);
      await get().loadConsumers(connId, stream);
    } catch (error) {
      console.error('Failed to create consumer:', error);
      throw error;
    }
  },

  deleteConsumer: async (connId, stream, name) => {
    try {
      await (window as any).natsAPI.jetstream.deleteConsumer(connId, stream, name);
      await get().loadConsumers(connId, stream);
    } catch (error) {
      console.error('Failed to delete consumer:', error);
      throw error;
    }
  },

  browseMessages: async (connId, stream, opts) => {
    try {
      const messages = await (window as any).natsAPI.jetstream.browseMessages(connId, stream, opts);
      const key = `${connId}:${stream}`;
      set((state) => ({ storedMessages: { ...state.storedMessages, [key]: messages } }));
      return messages as StoredMessage[];
    } catch (error) {
      console.error('Failed to browse messages:', error);
      throw error;
    }
  },

  fetchStreams: async (connId: string) => {
    return get().loadStreams(connId);
  },

  fetchConsumers: async (connId: string, stream: string) => {
    await get().loadConsumers(connId, stream);
    return get().consumers[`${connId}:${stream}`] || [];
  }
}));
