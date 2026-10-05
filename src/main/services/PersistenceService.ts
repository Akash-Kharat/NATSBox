import Store from 'electron-store';
import { ConnectionConfig, LoadTestConfig } from '../../shared/types';

interface StoreSchema {
  connections: ConnectionConfig[];
  loadTests: LoadTestConfig[];
}

class PersistenceService {
  private store: Store<StoreSchema>;

  constructor() {
    this.store = new Store<StoreSchema>({
      name: 'natsbox-data',
      defaults: {
        connections: [],
        loadTests: [],
      },
    });
  }

  // Connection configs
  getConnections(): ConnectionConfig[] {
    return this.store.get('connections', []);
  }

  saveConnection(config: ConnectionConfig): void {
    const connections = this.getConnections();
    const index = connections.findIndex(c => c.id === config.id);
    if (index >= 0) {
      connections[index] = config;
    } else {
      connections.push(config);
    }
    this.store.set('connections', connections);
  }

  saveAllConnections(configs: ConnectionConfig[]): void {
    this.store.set('connections', configs);
  }

  deleteConnection(id: string): void {
    const connections = this.getConnections();
    this.store.set('connections', connections.filter(c => c.id !== id));
  }

  // Load test configs  
  getLoadTests(): LoadTestConfig[] {
    return this.store.get('loadTests', []);
  }

  saveLoadTest(config: LoadTestConfig): void {
    const loadTests = this.getLoadTests();
    const index = loadTests.findIndex(t => t.id === config.id);
    if (index >= 0) {
      loadTests[index] = config;
    } else {
      loadTests.push(config);
    }
    this.store.set('loadTests', loadTests);
  }

  deleteLoadTest(id: string): void {
    const loadTests = this.getLoadTests();
    this.store.set('loadTests', loadTests.filter(t => t.id !== id));
  }

  // Import/Export
  exportAll(): string {
    const data = {
      connections: this.getConnections(),
      loadTests: this.getLoadTests(),
    };
    return JSON.stringify(data, null, 2);
  }

  importAll(jsonData: string): void {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.connections && Array.isArray(parsed.connections)) {
        this.store.set('connections', parsed.connections);
      }
      if (parsed.loadTests && Array.isArray(parsed.loadTests)) {
        this.store.set('loadTests', parsed.loadTests);
      }
    } catch (err) {
      console.error('Failed to import data', err);
      throw new Error('Invalid data format');
    }
  }
}

export const persistenceService = new PersistenceService();
export default persistenceService;
