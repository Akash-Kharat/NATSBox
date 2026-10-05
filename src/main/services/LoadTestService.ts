import { NatsConnection, StringCodec, NatsError } from 'nats';
import { LoadTestConfig, LoadTestProgress, LoadTestDataPoint } from '../../shared/types';
import { BrowserWindow } from 'electron';
import { IPC_CHANNELS } from '../../shared/constants';
import { v4 as uuid } from 'uuid';

class LoadTestService {
  private sc = StringCodec();
  private activeTests: Map<string, { stop: () => void }> = new Map();
  private mainWindow: BrowserWindow | null = null;

  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  async startTest(nc: NatsConnection, config: LoadTestConfig): Promise<string> {
    const testId = uuid();
    
    let isRunning = true;
    let messagesSent = 0;
    let messagesReceived = 0;
    let errors = 0;
    let latencies: number[] = [];
    
    let intervalHandle: NodeJS.Timeout;
    let reportHandle: NodeJS.Timeout;

    const stop = () => {
      isRunning = false;
      if (intervalHandle) clearInterval(intervalHandle);
      if (reportHandle) clearInterval(reportHandle);
      this.activeTests.delete(testId);
    };

    this.activeTests.set(testId, { stop });

    reportHandle = setInterval(() => {
      if (!this.mainWindow) return;

      latencies.sort((a, b) => a - b);
      const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0;
      const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
      const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;

      const progress: LoadTestProgress = {
        testId,
        status: isRunning ? 'running' : 'completed',
        messagesSent,
        messagesReceived,
        sent: messagesSent,
        received: messagesReceived,
        errors,
        currentRate: latencies.length, // approximation per sec
        avgLatencyMs: latencies.length ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0,
        p50LatencyMs: p50,
        p95LatencyMs: p95,
        p99LatencyMs: p99,
        latencies: {
          min: latencies[0] || 0,
          max: latencies[latencies.length - 1] || 0,
          p50,
          p95,
          p99,
          avg: latencies.length ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0
        }
      };

      const point: LoadTestDataPoint = {
        timestamp: Date.now(),
        messagesSent,
        messagesReceived,
        errors,
        latencyMs: p95,
        rate: progress.currentRate,
        latency: p95,
        sentRate: progress.currentRate,
        p50Latency: p50,
        p95Latency: p95,
        p99Latency: p99
      };

      this.mainWindow.webContents.send(IPC_CHANNELS.LOADTEST_PROGRESS, { progress, point });
      
      // Reset latencies for next interval
      latencies = [];

      if (config.totalMessages && Math.max(messagesSent, messagesReceived) >= config.totalMessages) {
        stop();
      }
    }, 1000);

    const publishLoop = async () => {
      const msBetweenBatches = 10;
      const msgsPerBatch = Math.max(1, Math.floor(config.ratePerSecond / (1000 / msBetweenBatches)));
      const payloadBytes = config.payloadSize || (config.payloadTemplate ? config.payloadTemplate.length : 64);
      const payloadStr = 'x'.repeat(payloadBytes);
      const payload = this.sc.encode(payloadStr);

      intervalHandle = setInterval(() => {
        if (!isRunning) return;
        
        for (let i = 0; i < msgsPerBatch; i++) {
          if (config.totalMessages && messagesSent >= config.totalMessages) {
            stop();
            break;
          }
          try {
            const t0 = Date.now();
            if (config.type === 'publish') {
              nc.publish(config.subject, payload);
              messagesSent++;
              latencies.push(Date.now() - t0);
            } else if (config.type === 'request-reply') {
              nc.request(config.subject, payload, { timeout: 5000 })
                .then(() => {
                  messagesReceived++;
                  latencies.push(Date.now() - t0);
                })
                .catch(() => {
                  errors++;
                });
              messagesSent++;
            }
          } catch (e) {
            errors++;
          }
        }
      }, msBetweenBatches);
    };

    if (config.type === 'subscribe') {
      const sub = nc.subscribe(config.subject);
      (async () => {
        for await (const msg of sub) {
          if (!isRunning) break;
          messagesReceived++;
          latencies.push(1); // Latency not meaningful in pure subscribe without timestamps
          if (config.totalMessages && messagesReceived >= config.totalMessages) {
            stop();
            break;
          }
        }
      })();
    } else {
      publishLoop();
    }

    return testId;
  }

  async stopTest(testId: string): Promise<void> {
    const test = this.activeTests.get(testId);
    if (test) {
      test.stop();
    }
  }

  stopAll(): void {
    for (const [id, test] of this.activeTests) {
      test.stop();
    }
  }
}

export const loadTestService = new LoadTestService();
export default loadTestService;
