import React from 'react';
import { X } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';

export default function Snackbar() {
  const { snackbars, dismissSnackbar } = useUIStore();

  return (
    <div className="snackbar-container">
      {snackbars.map(toast => (
        <div key={toast.id} className={`snackbar snackbar-${toast.type} slide-in`}>
          <span className="snackbar-message">{toast.message}</span>
          <button className="snackbar-close" onClick={() => dismissSnackbar(toast.id)}>
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}

