import React, { useState } from 'react';
import { Trash2, Send, ChevronDown, ChevronRight, ChevronUp, Plus, X, Layers, Code, Copy, CheckCircle2 } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';

export interface PublisherConfig {
  id: string;
  name?: string;
  subject: string;
  payload: string;
  encoding?: 'utf8' | 'json' | 'base64' | 'hex';
  replyTo?: string;
  headers?: Record<string, string>;
}

interface PublisherPanelProps {
  publisherConfig: PublisherConfig;
  connectionId: string;
  connectionStatus: string;
  onDelete: (id: string) => void;
  onUpdate: (id: string, config: Partial<PublisherConfig>) => void;
}

export default function PublisherPanel({
  publisherConfig,
  connectionId,
  connectionStatus,
  onDelete,
  onUpdate
}: PublisherPanelProps) {
  const [showHeaders, setShowHeaders] = useState(false);
  const [headerKey, setHeaderKey] = useState('');
  const [headerValue, setHeaderValue] = useState('');
  const [copied, setCopied] = useState(false);
  const { showSnackbar } = useUIStore();

  const isConnected = connectionStatus === 'connected';

  const handleUpdate = (field: string, value: any) => {
    onUpdate(publisherConfig.id, { [field]: value });
  };

  const addHeader = () => {
    if (!headerKey) return;
    const current = publisherConfig.headers || {};
    handleUpdate('headers', { ...current, [headerKey]: headerValue });
    setHeaderKey('');
    setHeaderValue('');
  };

  const removeHeader = (key: string) => {
    const current = { ...(publisherConfig.headers || {}) };
    delete current[key];
    handleUpdate('headers', current);
  };

  const handlePublish = async () => {
    if (!isConnected) return;
    
    try {
      if (typeof window !== 'undefined' && (window as any).natsAPI) {
        await (window as any).natsAPI.publish({
          connId: connectionId,
          subject: publisherConfig.subject,
          payload: publisherConfig.payload,
          encoding: publisherConfig.encoding || 'utf8',
          headers: publisherConfig.headers,
          replyTo: publisherConfig.replyTo
        });
        showSnackbar('Message published', 'success', 2000);
      }
    } catch (err: any) {
      showSnackbar(`Publish failed: ${err?.message || err}`, 'error', 5000);
    }
  };

  const formatPayload = () => {
    try {
      if (!publisherConfig.payload) return;
      const parsed = JSON.parse(publisherConfig.payload);
      handleUpdate('payload', JSON.stringify(parsed, null, 2));
    } catch (e) {
      showSnackbar('Invalid JSON payload', 'warning', 3000);
    }
  };

  return (
    <div className="flex flex-col bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden h-full flex-1 min-h-[450px]">
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#f0f7ff] border-b border-[#bae6fd]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider">Publisher</h3>
        </div>
        <button 
          onClick={() => onDelete(publisherConfig.id)}
          className="text-gray-400 hover:text-red-500 transition-colors p-1"
          title="Remove Publisher"
        >
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto custom-scrollbar">
        
        {/* Subject */}
        <div>
          <label className="block text-[12px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">Subject</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none font-mono text-blue-800"
            value={publisherConfig.subject || ''}
            onChange={(e) => handleUpdate('subject', e.target.value)}
            placeholder="e.g. sensor.temperature"
          />
        </div>

        {/* Payload Editor */}
        <div className="flex-1 flex flex-col flex-shrink-0 min-h-[200px]">
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-[12px] font-bold text-gray-700 uppercase tracking-wider">Payload</label>
            <div className="flex items-center gap-2">
              <select
                className="text-xs border-gray-300 rounded border px-2 py-1 outline-none focus:border-blue-500"
                value={publisherConfig.encoding || 'utf8'}
                onChange={(e) => handleUpdate('encoding', e.target.value)}
              >
                <option value="json">JSON</option>
                <option value="utf8">Text</option>
                <option value="base64">Base64</option>
                <option value="hex">Hex</option>
              </select>
              <button 
                onClick={formatPayload}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 transition-colors"
                title="Format JSON"
              >
                Format JSON
              </button>
            </div>
          </div>
          
          <textarea
            className="w-full flex-1 border border-gray-300 rounded px-3 py-2 text-sm font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-gray-50 text-gray-800 resize-none"
            value={publisherConfig.payload || ''}
            onChange={(e) => handleUpdate('payload', e.target.value)}
            placeholder="Enter message payload..."
          />
          <div className="text-[11px] text-gray-400 mt-1 flex justify-between">
            <span>{publisherConfig.payload?.length || 0} characters</span>
            <span>{new Blob([publisherConfig.payload || '']).size} bytes</span>
          </div>
        </div>

        {/* Reply-To */}
        <div>
          <label className="block text-[12px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">Reply-To <span className="text-gray-400 font-normal lowercase">(Optional)</span></label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none font-mono text-gray-700"
            value={publisherConfig.replyTo || ''}
            onChange={(e) => handleUpdate('replyTo', e.target.value)}
            placeholder="e.g. response.inbox"
          />
        </div>

        {/* Headers */}
        <div className="border border-gray-200 rounded-md overflow-hidden">
          <button 
            className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors"
            onClick={() => setShowHeaders(!showHeaders)}
          >
            <div className="flex items-center gap-2">
              <Layers size={14} className="text-gray-500" />
              <span className="text-[13px] font-semibold text-gray-700">Message Headers</span>
              {Object.keys(publisherConfig.headers || {}).length > 0 && (
                <span className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {Object.keys(publisherConfig.headers || {}).length}
                </span>
              )}
            </div>
            {showHeaders ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
          </button>
          
          {showHeaders && (
            <div className="p-3 bg-white border-t border-gray-200 space-y-3">
              {Object.entries(publisherConfig.headers || {}).length > 0 ? (
                <div className="border rounded divide-y divide-gray-100">
                  {Object.entries(publisherConfig.headers || {}).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between px-3 py-1.5 bg-gray-50/50">
                      <div className="grid grid-cols-2 gap-2 flex-1 text-xs font-mono">
                        <span className="text-gray-600 font-semibold truncate" title={key}>{key}</span>
                        <span className="text-gray-800 truncate" title={val}>{val}</span>
                      </div>
                      <button onClick={() => removeHeader(key)} className="text-gray-400 hover:text-red-500 ml-2">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-gray-400 italic text-center py-2">No headers configured.</div>
              )}
              
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  placeholder="Header Key" 
                  className="flex-1 border rounded px-2 py-1.5 text-xs font-mono"
                  value={headerKey}
                  onChange={e => setHeaderKey(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addHeader()}
                />
                <input 
                  type="text" 
                  placeholder="Value" 
                  className="flex-1 border rounded px-2 py-1.5 text-xs font-mono"
                  value={headerValue}
                  onChange={e => setHeaderValue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addHeader()}
                />
                <button 
                  onClick={addHeader}
                  disabled={!headerKey}
                  className="p-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded disabled:opacity-50"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer / Actions */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
        <button
          onClick={handlePublish}
          disabled={!isConnected || !publisherConfig.subject}
          className="flex items-center gap-2 px-5 py-2 rounded-md font-bold text-sm shadow-sm transition-colors bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={14} /> Publish Message
        </button>
      </div>

    </div>
  );
}
