import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Square, RotateCw, Trash2, Activity, Terminal, Plus, X } from 'lucide-react';
import { DockerContainer, NatsServerConfig } from '../../../shared/types';
import { useServerStore } from '../../stores/serverStore';

export const ServerManager: React.FC = () => {
  const navigate = useNavigate();
  const { containers, dockerAvailable, fetchContainers, startContainer, stopContainer, restartContainer, removeContainer, createContainer, getLogs } = useServerStore();

  const [showNewForm, setShowNewForm] = useState(false);
  const [newConfig, setNewConfig] = useState<NatsServerConfig>({
    name: 'nats-dev',
    image: 'nats:latest',
    clientPort: 4222,
    monitorPort: 8222,
    clusterPort: 6222,
    jetstream: true,
    configContent: ''
  });

  const [logsModal, setLogsModal] = useState<{ isOpen: boolean; title: string; content: string }>({ isOpen: false, title: '', content: '' });

  useEffect(() => {
    fetchContainers();
    const interval = setInterval(fetchContainers, 5000);
    return () => clearInterval(interval);
  }, [fetchContainers]);

  const handleCreate = async () => {
    await createContainer(newConfig);
    setShowNewForm(false);
    fetchContainers();
  };

  const handleViewLogs = async (id: string, name: string) => {
    const logs = await getLogs(id);
    setLogsModal({ isOpen: true, title: `Logs: ${name}`, content: logs });
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-200 p-6 overflow-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Docker NATS Servers</h1>
          <div className="flex items-center text-sm mt-1">
            <div className={`w-2 h-2 rounded-full mr-2 ${dockerAvailable ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span>{dockerAvailable ? 'Docker Available' : 'Docker Unavailable'}</span>
          </div>
        </div>
        <button 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center shadow"
          onClick={() => setShowNewForm(!showNewForm)}
          disabled={!dockerAvailable}
        >
          {showNewForm ? <X size={18} className="mr-2" /> : <Plus size={18} className="mr-2" />}
          {showNewForm ? 'Cancel' : 'New Server'}
        </button>
      </div>

      {showNewForm && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 mb-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-white">Create NATS Server</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Container Name</label>
              <input type="text" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white" value={newConfig.name} onChange={e => setNewConfig({...newConfig, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Image Tag</label>
              <input type="text" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white" value={newConfig.image} onChange={e => setNewConfig({...newConfig, image: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Client Port</label>
              <input type="number" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white" value={newConfig.clientPort} onChange={e => setNewConfig({...newConfig, clientPort: parseInt(e.target.value)})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Monitor Port</label>
              <input type="number" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white" value={newConfig.monitorPort} onChange={e => setNewConfig({...newConfig, monitorPort: parseInt(e.target.value)})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Cluster Port</label>
              <input type="number" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white" value={newConfig.clusterPort} onChange={e => setNewConfig({...newConfig, clusterPort: parseInt(e.target.value)})} />
            </div>
            <div className="flex items-center mt-6">
              <input type="checkbox" id="js" className="mr-2" checked={newConfig.jetstream} onChange={e => setNewConfig({...newConfig, jetstream: e.target.checked})} />
              <label htmlFor="js" className="text-sm font-medium">Enable JetStream (-js)</label>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Custom Configuration (nats-server.conf)</label>
            <textarea 
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm font-mono h-32 text-white"
              value={newConfig.configContent}
              onChange={e => setNewConfig({...newConfig, configContent: e.target.value})}
              placeholder="# Optional NATS config file content"
            />
          </div>
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md" onClick={handleCreate}>
            Create & Start
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {containers.map(c => (
          <div key={c.id} className="bg-slate-800 border border-slate-700 rounded-lg p-5 shadow-lg flex flex-col">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-lg text-white">{c.name}</h3>
                <span className="text-xs text-slate-400 font-mono">{c.image}</span>
              </div>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${c.state === 'running' ? 'bg-green-900 text-green-300' : 'bg-slate-700 text-slate-300'}`}>
                {c.state}
              </span>
            </div>
            
            <div className="text-xs font-mono mb-4 flex-grow bg-slate-900 p-2 rounded text-slate-400">
              {c.ports.length === 0 ? 'No ports published' : c.ports.map(p => (
                <div key={`${p.privatePort}-${p.publicPort}`}>
                  {p.publicPort}:{p.privatePort}/{p.type}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 mt-auto">
              {c.state === 'running' ? (
                <button onClick={() => stopContainer(c.id)} className="p-2 bg-yellow-600 hover:bg-yellow-700 rounded text-white" title="Stop">
                  <Square size={16} />
                </button>
              ) : (
                <button onClick={() => startContainer(c.id)} className="p-2 bg-green-600 hover:bg-green-700 rounded text-white" title="Start">
                  <Play size={16} />
                </button>
              )}
              <button onClick={() => restartContainer(c.id)} className="p-2 bg-blue-600 hover:bg-blue-700 rounded text-white" title="Restart">
                <RotateCw size={16} />
              </button>
              <button onClick={() => handleViewLogs(c.id, c.name)} className="p-2 bg-slate-600 hover:bg-slate-500 rounded text-white" title="View Logs">
                <Terminal size={16} />
              </button>
              <button onClick={() => navigate(`/server/${c.id}/monitor`)} disabled={c.state !== 'running'} className={`p-2 rounded text-white ${c.state === 'running' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-slate-700 opacity-50'}`} title="Monitor">
                <Activity size={16} />
              </button>
              <div className="flex-grow"></div>
              <button onClick={() => removeContainer(c.id)} className="p-2 bg-red-600 hover:bg-red-700 rounded text-white" title="Remove">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {containers.length === 0 && (
          <div className="col-span-full text-center text-slate-500 py-10">
            No NATS containers found. Create one to get started.
          </div>
        )}
      </div>

      {logsModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-slate-700">
              <h2 className="text-xl font-bold text-white">{logsModal.title}</h2>
              <button onClick={() => setLogsModal({ ...logsModal, isOpen: false })} className="text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <div className="p-4 overflow-auto flex-grow bg-slate-950 text-green-400 font-mono text-sm whitespace-pre-wrap">
              {logsModal.content || 'No logs available.'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
