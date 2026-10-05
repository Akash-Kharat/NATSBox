import { create } from 'zustand';
import { v4 as uuid } from 'uuid';

export interface SnackbarMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

interface UIState {
  sidebarCollapsed: boolean;
  snackbars: SnackbarMessage[];
  
  toggleSidebar: () => void;
  showSnackbar: (message: string, type: SnackbarMessage['type'], duration?: number) => void;
  dismissSnackbar: (id: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  snackbars: [],

  toggleSidebar: () => {
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
  },

  showSnackbar: (message, type, duration = 5000) => {
    const id = uuid();
    set((state) => ({
      snackbars: [...state.snackbars, { id, message, type, duration }]
    }));

    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          snackbars: state.snackbars.filter((s) => s.id !== id)
        }));
      }, duration);
    }
  },

  dismissSnackbar: (id) => {
    set((state) => ({
      snackbars: state.snackbars.filter((s) => s.id !== id)
    }));
  }
}));
