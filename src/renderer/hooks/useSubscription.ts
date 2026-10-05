import { useState, useEffect } from 'react';
import { ReceivedMessage } from '../../shared/types';

export function useSubscription(
  connectionId: string, 
  subject: string, 
  isSubscribed: boolean, 
  queueGroup?: string
) {
  const [messages, setMessages] = useState<ReceivedMessage[]>([]);
  const [subId, setSubId] = useState<string | null>(null);

  useEffect(() => {
    if (!isSubscribed || !connectionId || !subject) return;

    let activeSubId: string | null = null;

    const startSub = async () => {
      try {
        const api = (window as any).natsAPI;
        if (api?.subscribe) {
          const id = await api.subscribe({
            connectionId,
            subject,
            queueGroup
          });
          activeSubId = id;
          setSubId(id);
        }
      } catch (err) {
        console.error('Subscription error:', err);
      }
    };

    startSub();

    const unsub = (window as any).natsAPI?.onMessage?.((_event: any, msg: any) => {
      const msgs = Array.isArray(msg) ? msg : [msg];
      const matching = msgs.filter((m: any) => 
        (activeSubId && (m.subId === activeSubId || m.subscriptionId === activeSubId)) ||
        m.subject === subject
      );
      if (matching.length > 0) {
        setMessages(prev => [...prev, ...matching]);
      }
    });

    return () => {
      if (typeof unsub === 'function') unsub();
      if (activeSubId && (window as any).natsAPI?.unsubscribe) {
        (window as any).natsAPI.unsubscribe(activeSubId);
      }
    };
  }, [connectionId, subject, isSubscribed, queueGroup]);

  return {
    messages,
    subId,
    clearMessages: () => setMessages([]),
  };
}

export default useSubscription;
