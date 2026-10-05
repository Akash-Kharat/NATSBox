import { Subscription, StringCodec, NatsConnection, Msg, headers as createHeaders } from 'nats';
import { v4 as uuid } from 'uuid';
import { NatsMessage, ReceivedMessage, SubscriberConfig } from '../../shared/types';
import { BrowserWindow } from 'electron';
import { IPC_CHANNELS } from '../../shared/constants';

interface ActiveSubscription {
  id: string;
  connectionId: string;
  subject: string;
  queueGroup?: string;
  subscription: Subscription;
}

class NatsSubscriptionManager {
  private subscriptions: Map<string, ActiveSubscription> = new Map();
  private mainWindow: BrowserWindow | null = null;
  private sc = StringCodec();
  
  private messageBuffer: ReceivedMessage[] = [];
  private batchInterval: NodeJS.Timeout | null = null;

  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  private flushMessageBuffer() {
    if (this.messageBuffer.length > 0 && this.mainWindow) {
      this.mainWindow.webContents.send(IPC_CHANNELS.MESSAGE_RECEIVED, [...this.messageBuffer]);
      this.messageBuffer = [];
    }
    this.batchInterval = null;
  }

  private queueMessage(msg: ReceivedMessage) {
    this.messageBuffer.push(msg);
    if (!this.batchInterval) {
      this.batchInterval = setTimeout(() => this.flushMessageBuffer(), 100);
    }
  }

  async subscribe(connectionId: string, nc: NatsConnection, subject: string, queueGroup?: string): Promise<string> {
    const subId = uuid();
    const opts: any = {};
    if (queueGroup) {
      opts.queue = queueGroup;
    }
    
    const sub = nc.subscribe(subject, opts);
    
    this.subscriptions.set(subId, {
      id: subId,
      connectionId,
      subject,
      queueGroup,
      subscription: sub,
    });

    (async () => {
      try {
        for await (const msg of sub) {
          const receivedMessage = this.buildMessage(msg.subject, msg.data, msg, subId, connectionId);
          this.queueMessage(receivedMessage);
        }
      } catch (err) {
        console.error(`Subscription error for ${subId} on ${subject}:`, err);
      }
    })();

    return subId;
  }

  async unsubscribe(subId: string): Promise<void> {
    const sub = this.subscriptions.get(subId);
    if (sub) {
      await sub.subscription.drain();
      this.subscriptions.delete(subId);
    }
  }

  async unsubscribeAll(connectionId: string): Promise<void> {
    const subsToDrain = [];
    for (const [subId, sub] of this.subscriptions.entries()) {
      if (sub.connectionId === connectionId) {
        subsToDrain.push(sub.subscription.drain());
        this.subscriptions.delete(subId);
      }
    }
    await Promise.all(subsToDrain);
  }

  getActiveSubscriptions(connectionId?: string): ActiveSubscription[] {
    const activeSubs = Array.from(this.subscriptions.values());
    if (connectionId) {
      return activeSubs.filter(sub => sub.connectionId === connectionId);
    }
    return activeSubs;
  }

  private buildMessage(subject: string, data: Uint8Array, msg: Msg, subId: string, connectionId: string): ReceivedMessage {
    let payload = '';
    try {
      payload = this.sc.decode(data);
    } catch (e) {
      payload = `[Binary Data: ${data.length} bytes]`;
    }

    const headers: Record<string, string> = {};
    
    if (msg.headers) {
      for (const [key, value] of msg.headers) {
        headers[key] = Array.isArray(value) ? value.join(', ') : String(value);
      }
    }

    return {
      id: uuid(),
      subId,
      subject,
      payload,
      payloadEncoding: 'utf8',
      headers,
      replyTo: msg.reply,
      timestamp: new Date().toISOString(),
      size: data.length
    };
  }
}

export const subscriptionManager = new NatsSubscriptionManager();
export default subscriptionManager;
