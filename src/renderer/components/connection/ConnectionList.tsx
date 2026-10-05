import React, { useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { Plus, Edit2, Trash2, Power, Activity, ChevronRight, Server } from 'lucide-react';
import { useConnectionStore } from '../../stores/connectionStore';

export const ConnectionList: React.FC = () => {
  const navigate = useNavigate();
  const { connections, connectionStatuses, loadConnections, deleteConnection, connect, disconnect } = useConnectionStore();

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  const handleConnectToggle = async (e: React.MouseEvent, id: string, status: string) => {
    e.stopPropagation();
    try {
      if (status === 'connected') {
        await disconnect(id);
      } else {
        await connect(id);
      }
    } catch (err: any) {
      alert(`Connection failed: ${err?.message || err}`);
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this connection?')) {
      deleteConnection(id);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Page Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between flex-shrink-0">
        <h1 className="text-lg font-bold flex items-center gap-2 text-gray-800">
          <Activity size={20} className="text-blue-500" />
          NATS Connections
        </h1>
        <button
          onClick={() => navigate('/connection/new')}
          className="flex items-center gap-2 hover:bg-blue-700 text-blue-600 px-4 py-2 rounded-md transition-colors text-sm font-medium"
        >
          <Plus size={16} /> Add Connection
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {!connections || connections.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-4">
              <Server size={36} className="text-blue-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">No Connections Yet</h3>
            <p className="text-gray-400 text-sm mb-6">Create a NATS connection to start publishing and subscribing.</p>
            <button
              onClick={() => navigate('/connection/new')}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-md text-sm font-medium"
            >
              <Plus size={16} /> New Connection
            </button>
          </div>
        ) : (
          <div className="space-y-3 max-w-4xl">
            {connections.map((c: any) => {
              const status = connectionStatuses[c.id]?.status || c.status || 'disconnected';
              const isConnected = status === 'connected';
              const isConnecting = status === 'connecting' || status === 'reconnecting';
              const isError = status === 'error';

              return (
                <div
                  key={c.id}
                  onClick={() => navigate(`/connection/${c.id}`)}
                  className="bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md cursor-pointer transition-all group"
                >
                  <div className="flex items-center px-8 py-4 gap-4">
                    {/* Status dot */}
                    <div className={`w-3 h-3 rounded-full mr-12 flex-shrink-0 ${isConnected ? 'bg-green-500' :
                        isConnecting ? 'bg-yellow-400 animate-pulse' :
                          isError ? 'bg-red-500' : 'bg-gray-300'
                      }`} />

                    {/* Name + server info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800 truncate">{c.name}</span>
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-mono flex-shrink-0">
                          {c.protocol || 'nats'}
                        </span>
                        {(c.publishers?.length > 0 || c.subscribers?.length > 0) && (
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            {c.publishers?.length || 0}P / {c.subscribers?.length || 0}S
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-400 mt-0.5 truncate">
                        {Array.isArray(c.servers) ? c.servers.join(', ') : c.servers}
                      </div>
                    </div>

                    {/* Status label */}
                    <div className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${isConnected ? 'bg-green-50 text-green-700' :
                        isConnecting ? 'bg-yellow-50 text-yellow-700' :
                          isError ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                      {isConnecting ? 'Connecting…' : status}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleConnectToggle(e, c.id, status)}
                        disabled={isConnecting}
                        className={`p-2 rounded-md transition-colors ${isConnected
                            ? 'text-red-500 hover:bg-red-50'
                            : isConnecting
                              ? 'text-yellow-400 cursor-wait'
                              : 'text-green-500 hover:bg-green-50'
                          }`}
                        title={isConnected ? 'Disconnect' : 'Connect'}
                      >
                        <Power size={17} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/connection/${c.id}/edit`); }}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={17} />
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, c.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>

                    <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-400 transition-colors flex-shrink-0" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Outlet />
    </div>
  );
};
