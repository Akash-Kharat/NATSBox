import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Square, Trash2, ArrowDown, Copy, ChevronDown, ChevronRight, Filter, Minimize2, Maximize2 } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';

export interface SubscriberConfig {
  id: string;
  name?: string;
  subject: string;
  queueGroup?: string;
  isSubscribed: boolean;
}

interface SubscriberPanelProps {
  subscriberConfig: SubscriberConfig;
  connectionId: string;
  connectionStatus: string;
  onDelete: (id: string) => void;
  onUpdate: (id: string, config: Partial<SubscriberConfig>) => void;
}

export default function SubscriberPanel({
  subscriberConfig,
  connectionId,
  connectionStatus,
  onDelete,
  onUpdate
}: SubscriberPanelProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [expandedMsg, setExpandedMsg] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const { showSnackbar } = useUIStore();
  const isConnected = connectionStatus === 'connected';

  // Listen for messages via window.natsAPI
  useEffect(() => {
    if (typeof window === 'undefined' || !(window as any).natsAPI) return;
    
    const unsubscribe = (window as any).natsAPI.onMessage((_: any, msg: any) => {
      // Very basic filtering - in reality you want to match subjects correctly
      // This matches exact subId if the backend provides it, or just assumes it's ours if subId matches
      if (msg.subId === subscriberConfig.id) {
        setMessages(prev => {
          const updated = [...prev, msg];
          // Keep max 1000 messages in UI
          if (updated.length > 1000) return updated.slice(updated.length - 1000);
          return updated;
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [subscriberConfig.id]);

  // Auto-scroll
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, autoScroll]);

  const handleUpdate = (field: string, value: any) => {
    onUpdate(subscriberConfig.id, { [field]: value });
  };

  const toggleSubscription = async () => {
    if (!isConnected) return;
    
    try {
      if (typeof window !== 'undefined' && (window as any).natsAPI) {
        if (subscriberConfig.isSubscribed) {
          await (window as any).natsAPI.unsubscribe(subscriberConfig.id);
          handleUpdate('isSubscribed', false);
        } else {
          await (window as any).natsAPI.subscribe({
            connId: connectionId,
            subId: subscriberConfig.id,
            subject: subscriberConfig.subject,
            queueGroup: subscriberConfig.queueGroup
          });
          handleUpdate('isSubscribed', true);
        }
      }
    } catch (err: any) {
      showSnackbar(`${subscriberConfig.isSubscribed ? 'Unsubscribe' : 'Subscribe'} failed: ${err?.message || err}`, 'error', 5000);
      handleUpdate('isSubscribed', false);
    }
  };

  // If connection drops, mark unsubscribed
  useEffect(() => {
    if (!isConnected && subscriberConfig.isSubscribed) {
      handleUpdate('isSubscribed', false);
    }
  }, [isConnected, subscriberConfig.isSubscribed]);

  const clearMessages = () => setMessages([]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showSnackbar('Copied to clipboard', 'info', 2000);
  };

  return (
    <div className="flex flex-col bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden h-full flex-1 min-h-[450px]">
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#fff7ed] border-b border-[#fed7aa]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-orange-500" />
          <h3 className="text-sm font-bold text-orange-900 uppercase tracking-wider">Subscriber</h3>
        </div>
        <button 
          onClick={() => onDelete(subscriberConfig.id)}
          className="text-gray-400 hover:text-red-500 transition-colors p-1"
          title="Remove Subscriber"
        >
          <X size={16} />
        </button>
      </div>

      {/* Configuration Area */}
      <div className="p-4 border-b border-gray-100 bg-white space-y-4 flex-shrink-0">
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="block text-[12px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">Subject</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none font-mono text-orange-800 disabled:bg-gray-50 disabled:text-gray-500"
              value={subscriberConfig.subject || ''}
              onChange={(e) => handleUpdate('subject', e.target.value)}
              placeholder="e.g. sensor.>"
              disabled={subscriberConfig.isSubscribed}
            />
          </div>
          <div className="col-span-1">
            <label className="block text-[12px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">Queue Group</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none font-mono disabled:bg-gray-50 disabled:text-gray-500"
              value={subscriberConfig.queueGroup || ''}
              onChange={(e) => handleUpdate('queueGroup', e.target.value)}
              placeholder="Optional"
              disabled={subscriberConfig.isSubscribed}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSubscription}
              disabled={!isConnected || !subscriberConfig.subject}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md font-bold text-sm shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                subscriberConfig.isSubscribed 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-orange-500 hover:bg-orange-600 text-white'
              }`}
            >
              {subscriberConfig.isSubscribed ? <Square size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
              {subscriberConfig.isSubscribed ? 'Unsubscribe' : 'Subscribe'}
            </button>
            
            {subscriberConfig.isSubscribed && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Listening
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer hover:text-gray-900">
              <input 
                type="checkbox" 
                checked={autoScroll} 
                onChange={(e) => setAutoScroll(e.target.checked)} 
                className="rounded text-orange-500 focus:ring-orange-500"
              />
              Auto-scroll
            </label>
            <div className="w-px h-4 bg-gray-300 mx-1" />
            <button 
              onClick={clearMessages}
              className="text-xs font-medium text-gray-600 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Messages Console */}
      <div className="flex-1 flex flex-col bg-[#1e1e1e] relative">
        <div className="flex justify-between items-center px-4 py-1.5 bg-[#252526] border-b border-[#333]">
          <span className="text-[11px] font-medium text-gray-400 uppercase tracking-widest">Message Stream</span>
          <span className="text-[11px] font-mono text-orange-400">{messages.length} msgs</span>
        </div>
        
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-2 custom-scrollbar font-mono text-[12px] leading-relaxed"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
              {subscriberConfig.isSubscribed ? (
                <>
                  <div className="w-8 h-8 rounded-full border-2 border-orange-500/30 border-t-orange-500 animate-spin mb-3" />
                  <p>Waiting for messages on <span className="text-orange-400">{subscriberConfig.subject}</span>...</p>
                </>
              ) : (
                <p>Not subscribed.</p>
              )}
            </div>
          ) : (
            <div className="space-y-1 pb-4">
              {messages.map((msg, i) => {
                const isExpanded = expandedMsg === msg.id;
                const time = new Date(msg.timestamp).toLocaleTimeString(undefined, { hour12: false, fractionalSecondDigits: 3 });
                
                return (
                  <div key={msg.id || i} className="group">
                    {/* Message Header Row */}
                    <div 
                      className={`flex items-start gap-3 px-2 py-1 hover:bg-[#2a2d2e] rounded cursor-pointer transition-colors ${isExpanded ? 'bg-[#2a2d2e]' : ''}`}
                      onClick={() => setExpandedMsg(isExpanded ? null : msg.id)}
                    >
                      <span className="text-gray-500 flex-shrink-0 mt-0.5 w-4">{isExpanded ? '▼' : '▶'}</span>
                      <span className="text-blue-400 flex-shrink-0">{time}</span>
                      <span className="text-orange-300 font-bold truncate flex-1">{msg.subject}</span>
                      <span className="text-gray-500 flex-shrink-0">{msg.size || msg.payload?.length || 0} B</span>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="pl-9 pr-2 py-2 mb-2 bg-[#1e1e1e] border-l-2 border-orange-500 ml-3 text-gray-300">
                        {/* Meta */}
                        <div className="flex gap-4 mb-3 pb-2 border-b border-[#333] text-[11px]">
                          {msg.replyTo && (
                            <div>
                              <span className="text-gray-500 mr-1">Reply-To:</span>
                              <span className="text-green-400">{msg.replyTo}</span>
                            </div>
                          )}
                          {msg.headers && Object.keys(msg.headers).length > 0 && (
                            <div>
                              <span className="text-gray-500 mr-1">Headers:</span>
                              <span className="text-yellow-200">{Object.keys(msg.headers).length}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Headers */}
                        {msg.headers && Object.keys(msg.headers).length > 0 && (
                          <div className="mb-3">
                            {Object.entries(msg.headers).map(([k, v]) => (
                              <div key={k} className="flex">
                                <span className="text-gray-400 w-32">{k}:</span>
                                <span className="text-yellow-100">{String(v)}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Payload */}
                        <div className="relative group/payload">
                          <button 
                            onClick={(e) => { e.stopPropagation(); copyToClipboard(msg.payload); }}
                            className="absolute top-2 right-2 p-1.5 bg-[#333] hover:bg-[#444] rounded text-gray-300 opacity-0 group-hover/payload:opacity-100 transition-opacity"
                            title="Copy Payload"
                          >
                            <Copy size={12} />
                          </button>
                          <pre className="bg-[#181818] p-3 rounded overflow-x-auto text-gray-200 whitespace-pre-wrap word-break-all border border-[#2a2a2a]">
                            {msg.payload}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
