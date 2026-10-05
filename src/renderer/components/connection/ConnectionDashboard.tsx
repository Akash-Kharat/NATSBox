import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Power, Settings, PlusCircle, LayoutDashboard, Send, Database, Zap, RefreshCw, Layers } from 'lucide-react';
import { useConnectionStore } from '../../stores/connectionStore';
import PublisherPanel from '../pubsub/PublisherPanel';
import SubscriberPanel from '../pubsub/SubscriberPanel';
import RequestReplyPanel from '../requestreply/RequestReplyPanel';
import { StreamList } from '../jetstream/StreamList';
import { KVBrowser } from '../kv/KVBrowser';

export const ConnectionDashboard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    connections, connectionStatuses,
    connect, disconnect,
    addPublisher, removePublisher, updatePublisher,
    addSubscriber, removeSubscriber, updateSubscriber
  } = useConnectionStore();
  const [activeTab, setActiveTab] = useState('pubsub');

  const connection = connections.find((c: any) => c.id === id);
  const statusInfo = id ? connectionStatuses[id] : null;
  const status = statusInfo?.status || 'disconnected';
  const isConnected = status === 'connected';
  const isConnecting = status === 'connecting' || status === 'reconnecting';

  if (!connection) {
    return (
      <div className="flex items-center justify-center h-full flex-col text-center p-6 bg-gray-50">
        <Database size={48} className="text-gray-300 mb-4" />
        <h2 className="text-xl font-bold mb-2 text-gray-700">Connection Not Found</h2>
        <p className="text-sm text-gray-500 mb-4">The connection you are trying to access does not exist.</p>
        <button onClick={() => navigate('/')} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded shadow-sm hover:bg-gray-50 text-sm font-medium">
          Return to Connections
        </button>
      </div>
    );
  }

  const handleConnectToggle = async () => {
    try {
      if (isConnected) {
        await disconnect(connection.id);
      } else {
        await connect(connection.id);
      }
    } catch (err: any) {
      alert(`Connection failed: ${err?.message || err}`);
    }
  };

  const tabs = [
    { id: 'pubsub',     label: 'Pub / Sub',      icon: <LayoutDashboard size={14} /> },
    { id: 'reqrep',     label: 'Request / Reply', icon: <Send size={14} /> },
    { id: 'jetstream',  label: 'JetStream',      icon: <Zap size={14} /> },
    { id: 'kv',         label: 'KV Store',       icon: <Layers size={14} /> },
  ];

  return (
    <div className="flex flex-col h-full bg-[#f8f9fa]">
      
      {/* Top Header Workspace info */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0 z-10 shadow-sm relative">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            title="Back to Connections"
          >
            <ArrowLeft size={18} strokeWidth={2.5} />
          </button>
          
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold text-gray-900">{connection.name}</h1>
              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] uppercase tracking-wider font-bold ${
                isConnected ? 'bg-green-100 text-green-700' : 
                isConnecting ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500' : isConnecting ? 'bg-yellow-500 animate-pulse' : 'bg-gray-400'}`} />
                {isConnected ? 'Connected' : isConnecting ? 'Connecting' : 'Disconnected'}
              </div>
            </div>
            <div className="text-xs text-gray-500 font-mono mt-0.5">
              {connection.protocol}://{Array.isArray(connection.servers) ? connection.servers.join(', ') : connection.servers}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/connection/${connection.id}/edit`)}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors mr-2"
            title="Connection Settings"
          >
            <Settings size={18} />
          </button>
          
          <button
            onClick={handleConnectToggle}
            disabled={isConnecting}
            className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium shadow-sm transition-colors border ${
              isConnected
                ? 'bg-white border-gray-300 text-red-600 hover:bg-red-50'
                : 'bg-blue-600 border-transparent text-white hover:bg-blue-700'
            }`}
          >
            <Power size={14} />
            {isConnected ? 'Disconnect' : 'Connect'}
          </button>
        </div>
      </header>

      {/* Workspace Tabs */}
      <div className="bg-white border-b border-gray-200 px-6 flex items-center justify-between flex-shrink-0 relative z-0">
        <nav className="flex gap-2 -mb-px">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-[13px] font-semibold border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
        
        {/* Context Actions for specific tabs */}
        {activeTab === 'pubsub' && (
          <div className="flex gap-2 py-1.5">
            <button
              onClick={() => addPublisher(connection.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-white border border-gray-300 text-gray-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 shadow-sm transition-colors"
            >
              <PlusCircle size={14} /> Add Publisher
            </button>
            <button
              onClick={() => addSubscriber(connection.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-white border border-gray-300 text-gray-700 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-300 shadow-sm transition-colors"
            >
              <PlusCircle size={14} /> Add Subscriber
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {!isConnected && (
          <div className="absolute inset-0 z-20 bg-gray-50/70 backdrop-blur-[1px] flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center max-w-sm">
              <Power size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-bold text-gray-800 mb-2">Workspace Offline</h3>
              <p className="text-sm text-gray-500 mb-6">Connect to the NATS server to publish, subscribe, and interact with JetStream or KV stores.</p>
              <button 
                onClick={handleConnectToggle}
                className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded font-medium shadow-sm hover:bg-blue-700 transition-colors"
              >
                Connect Now
              </button>
            </div>
          </div>
        )}

        {/* Tab Contents - Scrollable areas */}
        <div className={`h-full w-full overflow-y-auto ${isConnected ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          {activeTab === 'pubsub' && (
            <div className="p-4 md:p-6 w-full">
              {(!connection.publishers?.length && !connection.subscribers?.length) ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <LayoutDashboard size={40} className="mb-4 text-gray-300" />
                  <p className="text-sm">No publishers or subscribers configured.</p>
                  <p className="text-sm mt-1">Use the buttons in the toolbar to add them.</p>
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))',
                    gap: '20px',
                    alignContent: 'start'
                  }}
                >
                  {connection.publishers?.map((pub: any) => (
                    <PublisherPanel
                      key={pub.id}
                      publisherConfig={pub}
                      connectionId={connection.id}
                      connectionStatus={status as any}
                      onDelete={(pubId) => removePublisher(connection.id, pubId)}
                      onUpdate={(pubId, updates) => updatePublisher(connection.id, pubId, updates)}
                    />
                  ))}
                  {connection.subscribers?.map((sub: any) => (
                    <SubscriberPanel
                      key={sub.id}
                      subscriberConfig={sub}
                      connectionId={connection.id}
                      connectionStatus={status as any}
                      onDelete={(subId) => removeSubscriber(connection.id, subId)}
                      onUpdate={(subId, updates) => updateSubscriber(connection.id, subId, updates)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'reqrep' && (
            <div className="h-full p-4 md:p-6">
              <RequestReplyPanel connectionId={connection.id} connectionStatus={status as any} />
            </div>
          )}
          
          {activeTab === 'jetstream' && (
            <div className="h-full p-4 md:p-6">
              <StreamList connectionId={connection.id} />
            </div>
          )}
          
          {activeTab === 'kv' && (
            <div className="h-full p-4 md:p-6">
              <KVBrowser connectionId={connection.id} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
