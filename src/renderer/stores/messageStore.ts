import { create } from 'zustand';
import { PublishedMessage, ReceivedMessage, RequestReplyPair } from '../../shared/types';
import { MAX_MESSAGE_HISTORY } from '../../shared/constants';

interface MessageState {
  publishedMessages: Record<string, PublishedMessage[]>;  // keyed by pubId
  receivedMessages: Record<string, ReceivedMessage[]>;    // keyed by subId
  requestReplies: Record<string, RequestReplyPair[]>;     // keyed by connectionId
  
  addPublishedMessage: (pubId: string, message: PublishedMessage) => void;
  addReceivedMessage: (subId: string, message: ReceivedMessage) => void;
  addRequestReply: (connId: string, pair: RequestReplyPair) => void;
  updateRequestReply: (connId: string, id: string, updates: Partial<RequestReplyPair>) => void;
  clearPublishedMessages: (pubId: string) => void;
  clearReceivedMessages: (subId: string) => void;
  clearRequestReplies: (connId: string) => void;
}

export const useMessageStore = create<MessageState>((set) => ({
  publishedMessages: {},
  receivedMessages: {},
  requestReplies: {},

  addPublishedMessage: (pubId, message) => {
    set((state) => {
      const messages = state.publishedMessages[pubId] || [];
      const updated = [...messages, message];
      if (updated.length > MAX_MESSAGE_HISTORY) {
        updated.shift();
      }
      return {
        publishedMessages: { ...state.publishedMessages, [pubId]: updated }
      };
    });
  },

  addReceivedMessage: (subId, message) => {
    set((state) => {
      const messages = state.receivedMessages[subId] || [];
      const updated = [...messages, message];
      if (updated.length > MAX_MESSAGE_HISTORY) {
        updated.shift();
      }
      return {
        receivedMessages: { ...state.receivedMessages, [subId]: updated }
      };
    });
  },

  addRequestReply: (connId, pair) => {
    set((state) => {
      const pairs = state.requestReplies[connId] || [];
      const updated = [...pairs, pair];
      if (updated.length > MAX_MESSAGE_HISTORY) {
        updated.shift();
      }
      return {
        requestReplies: { ...state.requestReplies, [connId]: updated }
      };
    });
  },

  updateRequestReply: (connId, id, updates) => {
    set((state) => {
      const pairs = state.requestReplies[connId] || [];
      const updated = pairs.map((p) => p.id === id ? { ...p, ...updates } : p);
      return {
        requestReplies: { ...state.requestReplies, [connId]: updated }
      };
    });
  },

  clearPublishedMessages: (pubId) => {
    set((state) => {
      const copy = { ...state.publishedMessages };
      delete copy[pubId];
      return { publishedMessages: copy };
    });
  },

  clearReceivedMessages: (subId) => {
    set((state) => {
      const copy = { ...state.receivedMessages };
      delete copy[subId];
      return { receivedMessages: copy };
    });
  },

  clearRequestReplies: (connId) => {
    set((state) => {
      const copy = { ...state.requestReplies };
      delete copy[connId];
      return { requestReplies: copy };
    });
  }
}));
