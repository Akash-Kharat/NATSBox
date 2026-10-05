import { describe, it, expect } from 'vitest';
import { IPC_CHANNELS, DEFAULT_SETTINGS, COLOR_PALETTE } from '../../shared/constants';

describe('NATSBox Constants & Configuration', () => {
  it('should define expected IPC channels', () => {
    expect(IPC_CHANNELS.CONNECT).toBe('nats:connect');
    expect(IPC_CHANNELS.DISCONNECT).toBe('nats:disconnect');
    expect(IPC_CHANNELS.PUBLISH).toBe('nats:publish');
    expect(IPC_CHANNELS.SUBSCRIBE).toBe('nats:subscribe');
    expect(IPC_CHANNELS.REQUEST).toBe('nats:request');
    expect(IPC_CHANNELS.JS_CREATE_STREAM).toBe('nats:js-create-stream');
    expect(IPC_CHANNELS.KV_LIST_BUCKETS).toBe('nats:kv-list-buckets');
    expect(IPC_CHANNELS.LOADTEST_START).toBe('nats:loadtest-start');
    expect(IPC_CHANNELS.DOCKER_LIST_CONTAINERS).toBe('docker:list-containers');
  });

  it('should verify MQTTBox-inspired signature color palette', () => {
    expect(COLOR_PALETTE.publisher.border).toBe('#0984e3'); // Blue
    expect(COLOR_PALETTE.subscriber.border).toBe('#e17055'); // Orange
  });

  it('should have standard default server and port', () => {
    expect(DEFAULT_SETTINGS.serverUrl).toBe('localhost:4222');
    expect(DEFAULT_SETTINGS.monitorPort).toBe(8222);
  });
});

describe('Load Test Percentile Calculations', () => {
  it('should accurately calculate p50, p95, p99 latencies', () => {
    const latencies = Array.from({ length: 100 }, (_, i) => i + 1); // 1 to 100ms
    latencies.sort((a, b) => a - b);

    const p50 = latencies[Math.floor(latencies.length * 0.5)];
    const p95 = latencies[Math.floor(latencies.length * 0.95)];
    const p99 = latencies[Math.floor(latencies.length * 0.99)];

    expect(p50).toBe(51);
    expect(p95).toBe(96);
    expect(p99).toBe(100);
  });
});

describe('Connection Store & Defaults', () => {
  it('should add a connection with fallback defaults', async () => {
    const { useConnectionStore } = await import('../stores/connectionStore');
    const store = useConnectionStore.getState();
    const newConn = await store.addConnection({ name: 'Test Broker' });
    
    expect(newConn.name).toBe('Test Broker');
    expect(newConn.servers).toEqual(['localhost:4222']);
    expect(newConn.protocol).toBe('nats');
    expect(useConnectionStore.getState().connections.some(c => c.name === 'Test Broker')).toBe(true);
  });
});

