import React, { useState, useEffect } from 'react';
import { useKVStore } from '../../stores/kvStore';
import { Plus, Trash2, Edit2, History, Save, Play, Square, Eye, Activity } from 'lucide-react';
import { KVBucketInfo, KVEntry } from '../../../shared/types';

interface KVBrowserProps {
  connectionId: string;
}

export const KVBrowser: React.FC<KVBrowserProps> = ({ connectionId }) => {
  const store = useKVStore();
  const [selectedBucket, setSelectedBucket] = useState<string>('');
  const [showCreateBucket, setShowCreateBucket] = useState(false);
  const [bucketForm, setBucketForm] = useState({ name: '', history: 1, ttl: 0, storage: 'file', replicas: 1 });
  const [searchKey, setSearchKey] = useState('');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showAddKey, setShowAddKey] = useState(false);
  const [newKeyForm, setNewKeyForm] = useState({ key: '', value: '' });
  const [watchMode, setWatchMode] = useState(false);
  const [watchId, setWatchId] = useState<string | null>(null);
  const [historyMode, setHistoryMode] = useState(false);
  const [keyHistory, setKeyHistory] = useState<KVEntry[]>([]);

  const buckets = store.buckets[connectionId] || [];
  const stateKey = selectedBucket ? `${connectionId}:${selectedBucket}` : '';
  const keys = store.keys[stateKey] || [];
  const entryStateKey = selectedKey ? `${connectionId}:${selectedBucket}:${selectedKey}` : '';
  const entry = store.entries[entryStateKey];

  useEffect(() => {
    store.loadBuckets(connectionId);
  }, [connectionId]);

  useEffect(() => {
    if (selectedBucket) {
      store.loadKeys(connectionId, selectedBucket);
    }
  }, [selectedBucket, connectionId]);

  useEffect(() => {
    if (selectedBucket && selectedKey) {
      store.getValue(connectionId, selectedBucket, selectedKey);
      setHistoryMode(false);
    }
  }, [selectedKey, selectedBucket, connectionId]);

  useEffect(() => {
    if (entry) {
      setEditValue(entry.value || '');
    }
  }, [entry]);

  const handleCreateBucket = async () => {
    if (!bucketForm.name) return;
    await store.createBucket(connectionId, bucketForm.name, {
      history: bucketForm.history,
      ttl: bucketForm.ttl,
      storage: bucketForm.storage,
      replicas: bucketForm.replicas
    });
    setShowCreateBucket(false);
    setSelectedBucket(bucketForm.name);
  };

  const handleAddKey = async () => {
    if (!newKeyForm.key || !selectedBucket) return;
    await store.putValue(connectionId, selectedBucket, newKeyForm.key, newKeyForm.value);
    setShowAddKey(false);
    setSelectedKey(newKeyForm.key);
    store.loadKeys(connectionId, selectedBucket);
  };

  const handleUpdateValue = async () => {
    if (!selectedKey || !selectedBucket) return;
    await store.putValue(connectionId, selectedBucket, selectedKey, editValue);
  };

  const handleDeleteKey = async (key: string) => {
    if (!selectedBucket) return;
    await store.deleteKey(connectionId, selectedBucket, key);
    if (selectedKey === key) {
      setSelectedKey(null);
    }
  };

  const handleViewHistory = async () => {
    if (!selectedBucket || !selectedKey) return;
    const history = await store.getHistory(connectionId, selectedBucket, selectedKey);
    setKeyHistory(history);
    setHistoryMode(true);
  };

  const toggleWatchMode = async () => {
    if (watchMode && watchId) {
      await store.stopWatch(watchId);
      setWatchId(null);
      setWatchMode(false);
    } else if (!watchMode && selectedBucket) {
      const id = await store.startWatch(connectionId, selectedBucket);
      setWatchId(id);
      setWatchMode(true);
    }
  };

  const filteredKeys = keys.filter(k => k.toLowerCase().includes(searchKey.toLowerCase()));

  return (
    <div className="flex flex-col h-full bg-gray-50 text-gray-900 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 bg-white p-4 rounded shadow-sm">
        <div className="flex items-center space-x-4">
          <select 
            className="border p-2 rounded min-w-[200px]"
            value={selectedBucket}
            onChange={(e) => setSelectedBucket(e.target.value)}
          >
            <option value="">-- Select Bucket --</option>
            {buckets.map(b => (
              <option key={b.bucket} value={b.bucket}>{b.bucket}</option>
            ))}
          </select>
          <button 
            className="flex items-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => setShowCreateBucket(!showCreateBucket)}
          >
            <Plus size={16} className="mr-1" /> Create Bucket
          </button>
        </div>
      </div>

      {showCreateBucket && (
        <div className="bg-white p-4 rounded shadow-sm mb-4 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Bucket Name</label>
            <input type="text" className="w-full border p-2 rounded" value={bucketForm.name} onChange={e => setBucketForm({...bucketForm, name: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm mb-1">History Depth</label>
            <input type="number" className="w-full border p-2 rounded" value={bucketForm.history} onChange={e => setBucketForm({...bucketForm, history: parseInt(e.target.value)})} />
          </div>
          <div>
            <label className="block text-sm mb-1">TTL (ms)</label>
            <input type="number" className="w-full border p-2 rounded" value={bucketForm.ttl} onChange={e => setBucketForm({...bucketForm, ttl: parseInt(e.target.value)})} />
          </div>
          <div>
            <label className="block text-sm mb-1">Storage Type</label>
            <select className="w-full border p-2 rounded" value={bucketForm.storage} onChange={e => setBucketForm({...bucketForm, storage: e.target.value})}>
              <option value="file">File</option>
              <option value="memory">Memory</option>
            </select>
          </div>
          <div className="col-span-2">
            <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={handleCreateBucket}>Create</button>
          </div>
        </div>
      )}

      {selectedBucket && (
        <div className="flex flex-1 overflow-hidden space-x-4">
          {/* Key List Pane */}
          <div className="w-1/3 flex flex-col bg-white rounded shadow-sm border">
            <div className="p-3 border-b bg-gray-100 flex items-center justify-between">
              <input 
                type="text" 
                placeholder="Search keys..." 
                className="w-full border p-1 rounded mr-2"
                value={searchKey}
                onChange={e => setSearchKey(e.target.value)}
              />
              <button 
                className="p-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                title="Add Key"
                onClick={() => setShowAddKey(!showAddKey)}
              >
                <Plus size={18} />
              </button>
            </div>
            
            <div className="p-2 border-b bg-gray-50 flex items-center justify-between">
               <span className="text-xs font-semibold text-gray-500">WATCH MODE</span>
               <button 
                  className={`flex items-center text-xs px-2 py-1 rounded ${watchMode ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-700'}`}
                  onClick={toggleWatchMode}
               >
                 {watchMode ? <Square size={12} className="mr-1"/> : <Play size={12} className="mr-1"/>}
                 {watchMode ? 'Stop Watch' : 'Start Watch'}
               </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {showAddKey && (
                <div className="p-3 border-b bg-yellow-50">
                  <input type="text" placeholder="Key name" className="w-full border p-1 rounded mb-2 text-sm" value={newKeyForm.key} onChange={e => setNewKeyForm({...newKeyForm, key: e.target.value})} />
                  <input type="text" placeholder="Initial value" className="w-full border p-1 rounded mb-2 text-sm" value={newKeyForm.value} onChange={e => setNewKeyForm({...newKeyForm, value: e.target.value})} />
                  <div className="flex justify-end space-x-2">
                    <button className="text-xs text-gray-500" onClick={() => setShowAddKey(false)}>Cancel</button>
                    <button className="text-xs bg-blue-600 text-white px-2 py-1 rounded" onClick={handleAddKey}>Add</button>
                  </div>
                </div>
              )}
              {filteredKeys.map(k => (
                <div 
                  key={k} 
                  className={`p-3 border-b cursor-pointer flex justify-between items-center hover:bg-blue-50 ${selectedKey === k ? 'bg-blue-100 border-l-4 border-l-blue-600' : ''}`}
                  onClick={() => setSelectedKey(k)}
                >
                  <span className="font-mono text-sm truncate">{k}</span>
                  <button className="text-red-400 hover:text-red-600" onClick={(e) => { e.stopPropagation(); handleDeleteKey(k); }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {filteredKeys.length === 0 && <div className="p-4 text-center text-gray-500 text-sm">No keys found.</div>}
            </div>
          </div>

          {/* Key Detail Pane */}
          <div className="w-2/3 bg-white rounded shadow-sm border flex flex-col overflow-hidden">
            {selectedKey && entry ? (
              <>
                <div className="p-4 border-b bg-gray-100 flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold font-mono">{entry.key}</h3>
                    <div className="text-xs text-gray-500 mt-1 flex space-x-4">
                      <span>Rev: {entry.revision}</span>
                      <span>Created: {new Date(entry.created).toLocaleString()}</span>
                    </div>
                  </div>
                  <button 
                    className="flex items-center px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                    onClick={handleViewHistory}
                  >
                    <History size={14} className="mr-1" /> History
                  </button>
                </div>

                <div className="flex-1 p-4 flex flex-col">
                  {historyMode ? (
                    <div className="flex-1 overflow-y-auto">
                      <h4 className="font-semibold mb-3 border-b pb-2">Revision History</h4>
                      <div className="space-y-3">
                        {keyHistory.map((h, i) => (
                          <div key={h.revision} className="p-3 bg-gray-50 border rounded text-sm">
                            <div className="flex justify-between text-xs text-gray-500 mb-2 border-b pb-1">
                              <span>Rev: {h.revision}</span>
                              <span>{new Date(h.created).toLocaleString()}</span>
                            </div>
                            <pre className="font-mono whitespace-pre-wrap">{h.value}</pre>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      <h4 className="font-semibold mb-2 text-sm text-gray-700">Value</h4>
                      <textarea 
                        className="flex-1 w-full border rounded p-3 font-mono text-sm bg-gray-50 focus:bg-white"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                      />
                      <div className="mt-4 flex justify-end">
                        <button 
                          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                          onClick={handleUpdateValue}
                        >
                          <Save size={16} className="mr-2" /> Update Value
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Activity size={48} className="mx-auto mb-2 opacity-50" />
                  <p>Select a key to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {!selectedBucket && (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <p>Select or create a bucket to view keys</p>
        </div>
      )}
    </div>
  );
};
