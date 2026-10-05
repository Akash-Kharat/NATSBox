import React, { useState, useEffect } from 'react';
import { Database, Plus, RefreshCw, Trash2, Users, Search, AlertTriangle } from 'lucide-react';
import { useJetStreamStore } from '../../stores/jetStreamStore';
import { StreamForm } from './StreamForm';
import { ConsumerList } from './ConsumerList';
import { MessageBrowser } from './MessageBrowser';

interface StreamListProps {
  connectionId: string;
}

export const StreamList: React.FC<StreamListProps> = ({ connectionId }) => {
  const { streams, fetchStreams, deleteStream, purgeStream } = useJetStreamStore();
  const [showForm, setShowForm] = useState(false);
  const [selectedStream, setSelectedStream] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'list' | 'consumers' | 'messages'>('list');
  const [activeStreamName, setActiveStreamName] = useState<string>('');
  
  const connStreams = streams[connectionId] || [];

  useEffect(() => {
    if (connectionId) {
      fetchStreams(connectionId);
    }
  }, [connectionId, fetchStreams]);

  const handlePurge = async (streamName: string) => {
    if (window.confirm(`Are you sure you want to purge all messages in stream '${streamName}'?`)) {
      await purgeStream(connectionId, streamName);
      fetchStreams(connectionId);
    }
  };

  const handleDelete = async (streamName: string) => {
    if (window.confirm(`Are you sure you want to delete stream '${streamName}'?`)) {
      await deleteStream(connectionId, streamName);
      fetchStreams(connectionId);
    }
  };

  if (viewMode === 'consumers') {
    return (
      <div>
        <button onClick={() => setViewMode('list')} className="mb-4 text-blue-600 hover:underline">&larr; Back to Streams</button>
        <ConsumerList connectionId={connectionId} streamName={activeStreamName} />
      </div>
    );
  }

  if (viewMode === 'messages') {
    return (
      <div>
        <button onClick={() => setViewMode('list')} className="mb-4 text-blue-600 hover:underline">&larr; Back to Streams</button>
        <MessageBrowser connectionId={connectionId} streamName={activeStreamName} />
      </div>
    );
  }

  if (showForm) {
    return (
      <StreamForm 
        connectionId={connectionId} 
        editStream={selectedStream} 
        onClose={() => {
          setShowForm(false);
          setSelectedStream(null);
          fetchStreams(connectionId);
        }} 
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Database className="text-blue-600" /> JetStream Streams
        </h2>
        <div className="flex gap-2">
          <button onClick={() => fetchStreams(connectionId)} className="p-2 border rounded hover:bg-gray-50" title="Refresh">
            <RefreshCw size={18} />
          </button>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            <Plus size={18} /> Create Stream
          </button>
        </div>
      </div>

      {!connStreams || connStreams.length === 0 ? (
        <div className="text-center p-12 bg-white border border-dashed border-gray-300 rounded-lg text-gray-500">
          <Database size={48} className="mx-auto mb-4 text-gray-300" />
          <p>No streams found. Create one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {connStreams.map((s: any) => (
            <div key={s.config.name} className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-bold text-gray-800">{s.config.name}</h3>
                <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2 py-1 rounded capitalize border border-indigo-100">
                  {s.config.retention}
                </span>
              </div>
              
              <div className="text-sm text-gray-600 mb-4">
                <p className="truncate" title={s.config.subjects.join(', ')}>
                  <span className="font-semibold text-gray-700">Subjects:</span> <span className="font-mono text-gray-800 bg-gray-100 px-1 rounded">{s.config.subjects.join(', ')}</span>
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4 text-sm bg-gray-50 border border-gray-100 p-3 rounded">
                <div>
                  <span className="block text-gray-500 text-xs uppercase">Messages</span>
                  <span className="font-medium text-gray-900">{s.state.messages}</span>
                </div>
                <div>
                  <span className="block text-gray-500 text-xs uppercase">Bytes</span>
                  <span className="font-medium text-gray-900">{(s.state.bytes / 1024).toFixed(2)} KB</span>
                </div>
                <div>
                  <span className="block text-gray-500 text-xs uppercase">Consumers</span>
                  <span className="font-medium text-gray-900">{s.state.consumer_count}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                <button 
                  onClick={() => { setActiveStreamName(s.config.name); setViewMode('consumers'); }}
                  className="flex items-center gap-1 text-sm bg-gray-100 text-gray-700 px-3 py-1.5 rounded hover:bg-gray-200"
                >
                  <Users size={14} /> Consumers
                </button>
                <button 
                  onClick={() => { setActiveStreamName(s.config.name); setViewMode('messages'); }}
                  className="flex items-center gap-1 text-sm bg-gray-100 text-gray-700 px-3 py-1.5 rounded hover:bg-gray-200"
                >
                  <Search size={14} /> Browse
                </button>
                
                <div className="flex-1" />
                
                <button 
                  onClick={() => handlePurge(s.config.name)}
                  className="flex items-center gap-1 text-sm bg-yellow-50 text-yellow-700 px-3 py-1.5 rounded hover:bg-yellow-100"
                  title="Purge Messages"
                >
                  <AlertTriangle size={14} /> Purge
                </button>
                <button 
                  onClick={() => handleDelete(s.config.name)}
                  className="flex items-center gap-1 text-sm bg-red-50 text-red-600 px-3 py-1.5 rounded hover:bg-red-100"
                  title="Delete Stream"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
