import { ServerVarz, ServerConnz, ServerRoutez, ServerSubsz, ServerJsz, ServerMetrics } from '../../shared/types';
import { BrowserWindow } from 'electron';
import { IPC_CHANNELS } from '../../shared/constants';
import http from 'http';

class NatsMonitoringService {
  private activePollers: Map<string, NodeJS.Timeout> = new Map();
  private mainWindow: BrowserWindow | null = null;

  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  async startMonitoring(monitorUrl: string, intervalMs: number = 5000): Promise<void> {
    if (this.activePollers.has(monitorUrl)) {
      this.stopMonitoring(monitorUrl);
    }

    const poll = async () => {
      try {
        const metrics = await this.fetchAllMetrics(monitorUrl);
        if (this.mainWindow) {
          this.mainWindow.webContents.send(IPC_CHANNELS.MONITOR_METRICS, { url: monitorUrl, metrics });
        }
      } catch (e) {
        console.error(`Failed to fetch NATS metrics for ${monitorUrl}:`, e);
      }
    };

    await poll(); // Initial fetch
    const interval = setInterval(poll, intervalMs);
    this.activePollers.set(monitorUrl, interval);
  }

  async stopMonitoring(monitorUrl: string): Promise<void> {
    const interval = this.activePollers.get(monitorUrl);
    if (interval) {
      clearInterval(interval);
      this.activePollers.delete(monitorUrl);
    }
  }

  private async fetchEndpoint<T>(url: string): Promise<T> {
    return new Promise((resolve, reject) => {
      http.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', reject);
    });
  }

  private async fetchAllMetrics(baseUrl: string): Promise<ServerMetrics> {
    const safeUrl = baseUrl.startsWith('http') ? baseUrl : `http://${baseUrl}`;
    const [varz, connz, routez, subsz, jsz] = await Promise.all([
      this.fetchEndpoint<ServerVarz>(`${safeUrl}/varz`),
      this.fetchEndpoint<ServerConnz>(`${safeUrl}/connz`),
      this.fetchEndpoint<ServerRoutez>(`${safeUrl}/routez`),
      this.fetchEndpoint<ServerSubsz>(`${safeUrl}/subsz`),
      this.fetchEndpoint<ServerJsz>(`${safeUrl}/jsz`).catch(() => undefined) // JS might not be enabled
    ]);

    return { varz, connz, routez, subsz, jsz, lastUpdated: new Date().toISOString() };
  }

  stopAll(): void {
    for (const interval of this.activePollers.values()) {
      clearInterval(interval);
    }
    this.activePollers.clear();
  }
}

export const monitoringService = new NatsMonitoringService();
export default monitoringService;
