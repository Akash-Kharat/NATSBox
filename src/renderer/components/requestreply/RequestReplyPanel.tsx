import React, { useState } from 'react';
import { Send, ChevronDown, ChevronUp, CheckCircle2, XCircle, AlertCircle, Clock, Loader2, Copy, Play } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';

interface RequestReplyPanelProps {
  connectionId: string;
  connectionStatus?: 'connected' | 'disconnected' | 'reconnecting'; // Make optional to match usage
}

interface RequestResponsePair {
  id: string;
  subject: string;
  timestamp: string;
  requestPayload: string;
  responsePayload?: string;
  responseHeaders?: Record<string, string>;
  status: 'pending' | 'received' | 'timeout' | 'error';
  latency?: number;
  error?: string;
}

export default function RequestReplyPanel({ connectionId, connectionStatus }: RequestReplyPanelProps) {
  const [subject, setSubject] = useState('');
  const [payload, setPayload] = useState('');
  const [timeout, setTimeoutVal] = useState('2000');
  
  const [history, setHistory] = useState<RequestResponsePair[]>([]);
  const { showSnackbar } = useUIStore();

  const handleSendRequest = async () => {
    if (!subject.trim()) return;

    const reqId = Date.now().toString();

    const newReq: RequestResponsePair = {
      id: reqId,
      subject,
      timestamp: new Date().toISOString(),
      requestPayload: payload,
      status: 'pending'
    };

    setHistory(prev => [newReq, ...prev]);

    const startTime = performance.now();

    try {
      if (typeof window !== 'undefined' && (window as any).natsAPI) {
        const response = await (window as any).natsAPI.request({
          connId: connectionId, // NOTE: fixed to match preload 'connId' parameter pattern
          subject,
          payload,
          timeout: parseInt(timeout, 10) || 2000
        });

        const latency = Math.round(performance.now() - startTime);
        
        setHistory(prev => prev.map(req => req.id === reqId ? {
          ...req,
          status: 'received',
          latency,
          responsePayload: response.payload,
          responseHeaders: response.headers
        } : req));
      } else {
        throw new Error('NATS API unavailable');
      }
    } catch (error: any) {
      const latency = Math.round(performance.now() - startTime);
      const isTimeout = error.message?.toLowerCase().includes('timeout');
      
      setHistory(prev => prev.map(req => req.id === reqId ? {
        ...req,
        status: isTimeout ? 'timeout' : 'error',
        latency,
        error: error.message || 'Unknown error'
      } : req));
    }
  };

  const activeRequest = history[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start h-full pb-10">
      {/* Configuration Panel */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col">
        <div className="px-4 py-3 bg-[#f8f7ff] border-b border-[#e0dfff] flex items-center gap-2 rounded-t-lg">
          <div className="w-2 h-2 rounded-full bg-[#6c5ce7]" />
          <h3 className="text-sm font-bold text-[#4a3f9e] uppercase tracking-wider">Request</h3>
        </div>
        
        <div className="p-5 space-y-5">
          <div>
            <label className="block text-[12px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">Subject</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:border-[#6c5ce7] focus:ring-1 focus:ring-[#6c5ce7] outline-none font-mono text-[#4a3f9e]"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. service.device.status"
            />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[12px] font-bold text-gray-700 uppercase tracking-wider">Payload</label>
            </div>
            <textarea
              className="w-full h-40 border border-gray-300 rounded-md px-3 py-2 text-sm font-mono focus:border-[#6c5ce7] focus:ring-1 focus:ring-[#6c5ce7] outline-none bg-gray-50 text-gray-800 resize-none"
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              placeholder='{ "device": "MOTOR-01" }'
            />
          </div>

          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-[12px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">Timeout (ms)</label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:border-[#6c5ce7] focus:ring-1 focus:ring-[#6c5ce7] outline-none font-mono"
                value={timeout}
                onChange={(e) => setTimeoutVal(e.target.value)}
                min="100"
              />
            </div>
            <button
              onClick={handleSendRequest}
              disabled={!subject}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-2 rounded-md font-bold text-sm shadow-sm transition-colors bg-[#6c5ce7] hover:bg-[#5b4dcf] text-white disabled:opacity-50 disabled:cursor-not-allowed h-[38px]"
            >
              <Send size={16} /> Send Request
            </button>
          </div>
        </div>
      </div>

      {/* Response Panel */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col min-h-[400px]">
        <div className="px-4 py-3 bg-[#f0fdf4] border-b border-[#bbf7d0] flex items-center gap-2 rounded-t-lg">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <h3 className="text-sm font-bold text-green-900 uppercase tracking-wider">Response</h3>
        </div>

        <div className="flex-1 p-5 flex flex-col">
          {!activeRequest ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <Play size={40} className="mb-4 text-gray-200" />
              <p className="text-sm font-medium">Send a request to see the response.</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col animate-in fade-in">
              
              {/* Status Banner */}
              <div className={`flex items-center justify-between p-3 rounded-md mb-4 border ${
                activeRequest.status === 'received' ? 'bg-green-50 border-green-200 text-green-800' :
                activeRequest.status === 'timeout' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
                activeRequest.status === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
                'bg-blue-50 border-blue-200 text-blue-800'
              }`}>
                <div className="flex items-center gap-2 font-medium text-sm">
                  {activeRequest.status === 'received' && <CheckCircle2 size={18} className="text-green-600" />}
                  {activeRequest.status === 'timeout' && <Clock size={18} className="text-yellow-600" />}
                  {activeRequest.status === 'error' && <AlertCircle size={18} className="text-red-600" />}
                  {activeRequest.status === 'pending' && <Loader2 size={18} className="text-blue-600 animate-spin" />}
                  
                  {activeRequest.status === 'received' && 'Response received'}
                  {activeRequest.status === 'timeout' && 'Request timed out'}
                  {activeRequest.status === 'error' && 'Request failed'}
                  {activeRequest.status === 'pending' && 'Waiting for response...'}
                </div>
                {activeRequest.latency !== undefined && (
                  <div className="text-sm font-mono font-bold bg-white/50 px-2 py-0.5 rounded">
                    {activeRequest.latency} ms
                  </div>
                )}
              </div>

              {/* Error Message */}
              {activeRequest.error && (
                <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-100 font-mono">
                  {activeRequest.error}
                </div>
              )}

              {/* Payload */}
              <div className="flex-1 flex flex-col relative">
                <label className="block text-[12px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">Response Data</label>
                <div className="flex-1 border border-gray-200 rounded-md bg-[#1e1e1e] p-3 overflow-y-auto relative group">
                  {activeRequest.responsePayload ? (
                    <>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(activeRequest.responsePayload || '');
                          showSnackbar('Copied response', 'success');
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-[#333] hover:bg-[#444] rounded text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Copy Response"
                      >
                        <Copy size={14} />
                      </button>
                      <pre className="font-mono text-[13px] text-gray-300 whitespace-pre-wrap word-break-all">
                        {activeRequest.responsePayload}
                      </pre>
                    </>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-600 italic text-sm">
                      {activeRequest.status === 'pending' ? '...' : 'No payload'}
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
