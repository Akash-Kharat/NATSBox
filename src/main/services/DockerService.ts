import Docker from 'dockerode';
import { DockerContainer, NatsServerConfig } from '../../shared/types';
import fs from 'fs';
import path from 'path';
import os from 'os';

class DockerService {
  private docker: Docker;
  private available: boolean = false;

  constructor() {
    this.docker = new Docker();
    this.checkAvailability();
  }

  private async checkAvailability(): Promise<void> {
    try { 
      await this.docker.ping(); 
      this.available = true; 
    } catch { 
      this.available = false; 
    }
  }

  isAvailable(): boolean { return this.available; }

  async listNatsContainers(): Promise<DockerContainer[]> {
    if (!this.available) return [];
    
    const containers = await this.docker.listContainers({ all: true });
    
    return containers
      .filter(c => c.Image.includes('nats'))
      .map(c => ({
        id: c.Id,
        name: c.Names[0].replace(/^\//, ''),
        image: c.Image,
        state: c.State,
        status: c.Status as any,
        created: new Date(c.Created * 1000).toISOString(),
        ports: c.Ports.map(p => ({
          privatePort: p.PrivatePort,
          publicPort: p.PublicPort,
          type: p.Type,
          host: p.PublicPort || 0,
          container: p.PrivatePort,
          protocol: p.Type
        }))
      })) as any;
  }

  async createNatsContainer(config: NatsServerConfig): Promise<string> {
    const imageTag = config.image || 'nats:latest';
    await this.pullImage(imageTag);

    const portBindings: Record<string, any[]> = {};
    const exposedPorts: Record<string, {}> = {};

    const addPort = (internal: number, external?: number) => {
      if (external) {
        exposedPorts[`${internal}/tcp`] = {};
        portBindings[`${internal}/tcp`] = [{ HostPort: external.toString() }];
      }
    };

    addPort(4222, config.clientPort);
    addPort(8222, config.monitorPort);
    addPort(6222, config.clusterPort);

    const cmd: string[] = [];
    if (config.monitorPort) {
      cmd.push('-m', '8222');
    }

    const binds: string[] = [];

    if (config.jetstream) {
      cmd.push('-js');
    }

    if (config.configContent) {
      const tempDir = os.tmpdir();
      const confPath = path.join(tempDir, `nats-${Date.now()}.conf`);
      fs.writeFileSync(confPath, config.configContent);
      binds.push(`${confPath}:/etc/nats/nats-server.conf:ro`);
      cmd.push('-c', '/etc/nats/nats-server.conf');
    }

    const container = await this.docker.createContainer({
      Image: imageTag,
      name: config.name,
      Cmd: cmd,
      ExposedPorts: exposedPorts,
      HostConfig: {
        PortBindings: portBindings,
        Binds: binds
      }
    });

    await container.start();
    return container.id;
  }

  async startContainer(id: string): Promise<void> {
    const container = this.docker.getContainer(id);
    await container.start();
  }

  async stopContainer(id: string): Promise<void> {
    const container = this.docker.getContainer(id);
    await container.stop();
  }

  async restartContainer(id: string): Promise<void> {
    const container = this.docker.getContainer(id);
    await container.restart();
  }

  async removeContainer(id: string): Promise<void> {
    const container = this.docker.getContainer(id);
    await container.remove({ force: true });
  }

  async pullImage(tag: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.docker.pull(tag, (err: any, stream: any) => {
        if (err) return reject(err);
        this.docker.modem.followProgress(stream, (err2: any) => {
          if (err2) return reject(err2);
          resolve();
        });
      });
    });
  }

  async getContainerLogs(id: string, tail: number = 100): Promise<string> {
    const container = this.docker.getContainer(id);
    const logs = await container.logs({ stdout: true, stderr: true, tail });
    return logs.toString('utf-8');
  }

  async streamContainerLogs(id: string, callback: (log: string) => void): Promise<() => void> {
    const container = this.docker.getContainer(id);
    const stream = await container.logs({ stdout: true, stderr: true, follow: true });
    
    stream.on('data', (chunk: Buffer) => {
      callback(chunk.toString('utf-8'));
    });

    return () => {
      if (typeof (stream as any)?.destroy === 'function') {
        (stream as any).destroy();
      }
    };
  }
}

export const dockerService = new DockerService();
export default dockerService;
