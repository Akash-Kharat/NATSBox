import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Server, Users, Network, Activity, Database } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useServerStore } from '../../stores/serverStore';

export const ServerMonitorDashboard: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // can be containerId or host address
  const navigate = useNavigate();
  const { startMonitoring, stopMonitoring, latestMetrics, containers, fetchContainers } = useServerStore();
  
  const [activeTab, setActiveTab] = useState<'connections' | 'routes' | 'subscriptions' | 'jetstream'>('connections');
  const [intervalMs, setIntervalMs] = useState(5000);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchContainers();
  }, [fetchContainers]);

  const container = containers.find(c => c.id === id);
  // Default to localhost:8222 if not a container, or find the mapped port
  const monitorPort = container?.ports.find(p => p.privatePort === 8222)?.publicPort || 8222;
  const monitorUrl = `http://localhost:${monitorPort}`;

  useEffect(() => {
    startMonitoring(monitorUrl, intervalMs);
    return () => {
      stopMonitoring(monitorUrl);
    };
  }, [monitorUrl, intervalMs, startMonitoring, stopMonitoring]);

  useEffect(() => {
    if (latestMetrics) {
      setHistory(prev => {
        const newHistory = [...prev, {
          time: new Date().toLocaleTimeString(),
          inMsgs: latestMetrics.varz?.in_msgs || 0,
          outMsgs: latestMetrics.varz?.out_msgs || 0,
          connections: latestMetrics.varz?.connections || 0
        }].slice(-30); // Keep last 30 points
        return newHistory;
      });
    }
  }, [latestMetrics]);

  if (!latestMetrics?.varz) {
    return (
      <div className="flex h-full bg-slate-900 items-center justify-center text-slate-400">
        <RefreshCw className="animate-spin mr-3" /> Waiting for server metrics...
      </div>
    );
  }

  const v = latestMetrics.varz;
  const c = latestMetrics.connz;
  const r = latestMetrics.routez;
  const s = latestMetrics.subsz;
  const j = latestMetrics.jsz;

  const uptime = (duration: string) => duration;

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-200 overflow-auto">
      <div className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="mr-4 p-2 rounded hover:bg-slate-700 text-slate-300">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-white flex items-center">
            <Server className="mr-2 text-blue-500" />
            NATS Monitor: {container?.name || id}
          </h1>
        </div>
        <div className="flex items-center">
          <span className="text-sm mr-2 text-slate-400">Refresh:</span>
          <select 
            className="bg-slate-900 border border-slate-700 rounded p-1 text-sm text-white mr-4"
            value={intervalMs}
            onChange={e => setIntervalMs(parseInt(e.target.value))}
          >
            <option value={1000}>1s</option>
            <option value={5000}>5s</option>
            <option value={10000}>10s</option>
            <option value={30000}>30s</option>
          </select>
        </div>
      </div>

      <div className="p-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-4 mb-8">
          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <div className="text-slate-400 text-xs mb-1 uppercase">Version</div>
            <div className="text-xl font-bold text-white">{v.version}</div>
          </div>
          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <div className="text-slate-400 text-xs mb-1 uppercase">Uptime</div>
            <div className="text-lg font-bold text-white">{uptime(v.uptime)}</div>
          </div>
          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <div className="text-slate-400 text-xs mb-1 uppercase">CPU / Mem</div>
            <div className="text-lg font-bold text-white">{v.cpu}% / {(v.mem / 1024 / 1024).toFixed(1)}MB</div>
          </div>
          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <div className="text-slate-400 text-xs mb-1 uppercase">Connections</div>
            <div className="text-xl font-bold text-blue-400">{v.connections}</div>
          </div>
          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <div className="text-slate-400 text-xs mb-1 uppercase">Subscriptions</div>
            <div className="text-xl font-bold text-purple-400">{v.subscriptions}</div>
          </div>
          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <div className="text-slate-400 text-xs mb-1 uppercase">Total Msgs In</div>
            <div className="text-lg font-bold text-green-400">{v.in_msgs.toLocaleString()}</div>
          </div>
          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <div className="text-slate-400 text-xs mb-1 uppercase">Total Msgs Out</div>
            <div className="text-lg font-bold text-yellow-400">{v.out_msgs.toLocaleString()}</div>
          </div>
          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <div className="text-slate-400 text-xs mb-1 uppercase">Bytes In / Out</div>
            <div className="text-sm font-bold text-white">
              {(v.in_bytes / 1024 / 1024).toFixed(1)}M / {(v.out_bytes / 1024 / 1024).toFixed(1)}M
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 h-64">
            <h3 className="text-sm font-semibold text-slate-300 mb-2">Throughput (Msgs)</h3>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#94a3b8" tick={{fontSize: 10}} />
                <YAxis stroke="#94a3b8" tick={{fontSize: 10}} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', color: '#f8fafc' }} />
                <Legend />
                <Line type="monotone" dataKey="inMsgs" name="Msgs In" stroke="#4ade80" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="outMsgs" name="Msgs Out" stroke="#facc15" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 h-64">
            <h3 className="text-sm font-semibold text-slate-300 mb-2">Connections</h3>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#94a3b8" tick={{fontSize: 10}} />
                <YAxis stroke="#94a3b8" tick={{fontSize: 10}} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', color: '#f8fafc' }} />
                <Line type="monotone" dataKey="connections" name="Connections" stroke="#60a5fa" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Details Tabs */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          <div className="flex border-b border-slate-700">
            <button className={`px-4 py-3 text-sm font-medium flex items-center ${activeTab === 'connections' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-750'}`} onClick={() => setActiveTab('connections')}>
              <Users size={16} className="mr-2" /> Connections ({c?.num_connections || 0})
            </button>
            <button className={`px-4 py-3 text-sm font-medium flex items-center ${activeTab === 'routes' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-750'}`} onClick={() => setActiveTab('routes')}>
              <Network size={16} className="mr-2" /> Routes ({r?.num_routes || 0})
            </button>
            <button className={`px-4 py-3 text-sm font-medium flex items-center ${activeTab === 'subscriptions' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-750'}`} onClick={() => setActiveTab('subscriptions')}>
              <Activity size={16} className="mr-2" /> Subscriptions ({s?.num_subscriptions || 0})
            </button>
            {j && (
              <button className={`px-4 py-3 text-sm font-medium flex items-center ${activeTab === 'jetstream' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-750'}`} onClick={() => setActiveTab('jetstream')}>
                <Database size={16} className="mr-2" /> JetStream
              </button>
            )}
          </div>
          
          <div className="p-4 overflow-auto max-h-96">
            {activeTab === 'connections' && c && (
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="text-xs text-slate-400 uppercase bg-slate-900">
                  <tr>
                    <th className="px-3 py-2">CID</th>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">IP</th>
                    <th className="px-3 py-2">Lang</th>
                    <th className="px-3 py-2">Subs</th>
                    <th className="px-3 py-2">Msgs In</th>
                    <th className="px-3 py-2">Msgs Out</th>
                    <th className="px-3 py-2">Uptime</th>
                  </tr>
                </thead>
                <tbody>
                  {c.connections?.map((conn: any) => (
                    <tr key={conn.cid} className="border-b border-slate-700 hover:bg-slate-750">
                      <td className="px-3 py-2 font-mono">{conn.cid}</td>
                      <td className="px-3 py-2">{conn.name || '-'}</td>
                      <td className="px-3 py-2">{conn.ip}</td>
                      <td className="px-3 py-2">{conn.lang} {conn.version}</td>
                      <td className="px-3 py-2">{conn.subscriptions}</td>
                      <td className="px-3 py-2">{conn.in_msgs.toLocaleString()}</td>
                      <td className="px-3 py-2">{conn.out_msgs.toLocaleString()}</td>
                      <td className="px-3 py-2">{conn.uptime}</td>
                    </tr>
                  ))}
                  {(!c.connections || c.connections.length === 0) && (
                    <tr><td colSpan={8} className="px-3 py-4 text-center text-slate-500">No active connections</td></tr>
                  )}
                </tbody>
              </table>
            )}

            {activeTab === 'routes' && r && (
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="text-xs text-slate-400 uppercase bg-slate-900">
                  <tr>
                    <th className="px-3 py-2">RID</th>
                    <th className="px-3 py-2">Remote ID</th>
                    <th className="px-3 py-2">IP</th>
                    <th className="px-3 py-2">Subs</th>
                    <th className="px-3 py-2">Msgs In</th>
                    <th className="px-3 py-2">Msgs Out</th>
                  </tr>
                </thead>
                <tbody>
                  {r.routes?.map((rt: any) => (
                    <tr key={rt.rid} className="border-b border-slate-700 hover:bg-slate-750">
                      <td className="px-3 py-2 font-mono">{rt.rid}</td>
                      <td className="px-3 py-2 font-mono">{rt.remote_id}</td>
                      <td className="px-3 py-2">{rt.ip}</td>
                      <td className="px-3 py-2">{rt.subscriptions}</td>
                      <td className="px-3 py-2">{rt.in_msgs.toLocaleString()}</td>
                      <td className="px-3 py-2">{rt.out_msgs.toLocaleString()}</td>
                    </tr>
                  ))}
                  {(!r.routes || r.routes.length === 0) && (
                    <tr><td colSpan={6} className="px-3 py-4 text-center text-slate-500">No active routes</td></tr>
                  )}
                </tbody>
              </table>
            )}

            {activeTab === 'subscriptions' && s && (
              <div className="grid grid-cols-3 gap-4">
                 <div className="bg-slate-900 p-4 rounded">
                   <div className="text-sm text-slate-400">Total Subs</div>
                   <div className="text-2xl font-bold">{s.num_subscriptions}</div>
                 </div>
                 <div className="bg-slate-900 p-4 rounded">
                   <div className="text-sm text-slate-400">Cache Hit Rate</div>
                   <div className="text-2xl font-bold">{s.cache_hit_rate ? (s.cache_hit_rate * 100).toFixed(2) : 0}%</div>
                 </div>
                 <div className="bg-slate-900 p-4 rounded">
                   <div className="text-sm text-slate-400">Avg Fanout</div>
                   <div className="text-2xl font-bold">{(s.avg_fanout ?? 0).toFixed(2)}</div>
                 </div>
              </div>
            )}

            {activeTab === 'jetstream' && j && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="bg-slate-900 p-4 rounded">
                   <h4 className="font-bold mb-2">General</h4>
                   <div className="flex justify-between border-b border-slate-700 py-1">
                     <span className="text-slate-400">Streams</span>
                     <span className="font-bold">{j.streams}</span>
                   </div>
                   <div className="flex justify-between border-b border-slate-700 py-1">
                     <span className="text-slate-400">Consumers</span>
                     <span className="font-bold">{j.consumers}</span>
                   </div>
                   <div className="flex justify-between py-1">
                     <span className="text-slate-400">Messages</span>
                     <span className="font-bold">{j.messages}</span>
                   </div>
                 </div>
                 <div className="bg-slate-900 p-4 rounded">
                   <h4 className="font-bold mb-2">Storage Usage</h4>
                   <div className="flex justify-between border-b border-slate-700 py-1">
                     <span className="text-slate-400">Memory</span>
                     <span className="font-bold">{(j.memory / 1024 / 1024).toFixed(2)} MB</span>
                   </div>
                   <div className="flex justify-between py-1">
                     <span className="text-slate-400">File</span>
                     <span className="font-bold">{(j.storage / 1024 / 1024).toFixed(2)} MB</span>
                   </div>
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
