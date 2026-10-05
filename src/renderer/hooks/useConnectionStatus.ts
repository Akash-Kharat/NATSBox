import { useEffect } from 'react';
import { useConnectionStore } from '../stores/connectionStore';

export function useConnectionStatus() {
  const { connectionStatuses, updateConnectionStatus } = useConnectionStore();

  useEffect(() => {
    const unsub = (window as any).natsAPI?.onConnectionStatusChange?.((_event: any, statusData: any) => {
      if (statusData?.connId) {
        updateConnectionStatus(statusData.connId, {
          id: statusData.connId,
          status: statusData.status,
          serverInfo: statusData.serverInfo,
        });
      }
    });

    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [updateConnectionStatus]);

  return {
    connectionStatuses,
    getStatus: (connId: string) => connectionStatuses[connId]?.status || 'disconnected',
  };
}

export default useConnectionStatus;
