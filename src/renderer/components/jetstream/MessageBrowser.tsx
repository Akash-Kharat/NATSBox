import React, { useState } from 'react';
import { Search, ChevronDown, ChevronRight, Download } from 'lucide-react';
import { useJetStreamStore } from '../../stores/jetStreamStore';

interface MessageBrowserProps {
  connectionId: string;
  streamName: string;
}

export const MessageBrowser: React.FC<MessageBrowserProps> = ({ connectionId, streamName }) => {
  const { browseMessages } = useJetStreamStore();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  
  const [filters, setFilters] = useState({
    subject: '',
    start_seq: 1,
    batch: 25
  });

  const loadMessages = async () => {
    setLoading(true);
    try {
      const res = await browseMessages(connectionId, streamName, filters);
      setMessages(res || []);
    } catch (err) {
      alert('Error fetching messages: ' + String(err));
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (seq: number) => {
    setExpandedId(expandedId === seq ? null : seq);
  };

  const formatPayload = (payload: string) => {
    try {
      if (!payload) return '';
      const obj = JSON.parse(payload);
      return JSON.stringify(obj, null, 2);
    } catch {
      return payload; // return raw if not JSON
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Filter Subject</label>
          <input 
            type="text" 
            value={filters.subject} 
            onChange={(e) => setFilters({...filters, subject: e.target.value})} 
            className="w-full border p-2 rounded" 
            placeholder="e.g. orders.>"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Seq</label>
          <input 
            type="number" 
            value={filters.start_seq} 
            onChange={(e) => setFilters({...filters, start_seq: Number(e.target.value)})} 
            className="w-24 border p-2 rounded" 
            min={1}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Batch Size</label>
          <select 
            value={filters.batch} 
            onChange={(e) => setFilters({...filters, batch: Number(e.target.value)})} 
            className="w-24 border p-2 rounded"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
        <button 
          onClick={loadMessages} 
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded font-medium hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
        >
          <Search size={18} /> {loading ? 'Loading...' : 'Load Messages'}
        </button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b text-sm text-gray-600">
              <th className="p-3 w-10"></th>
              <th className="p-3 w-24">Seq</th>
              <th className="p-3">Subject</th>
              <th className="p-3 w-48">Time</th>
              <th className="p-3">Preview</th>
            </tr>
          </thead>
          <tbody>
            {messages.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500 bg-gray-50">
                  No messages found matching criteria.
                </td>
              </tr>
            ) : (
              messages.map((m: any) => (
                <React.Fragment key={m.seq}>
                  <tr 
                    onClick={() => toggleExpand(m.seq)} 
                    className="border-b hover:bg-blue-50 cursor-pointer transition-colors"
                  >
                    <td className="p-3 text-gray-400">
                      {expandedId === m.seq ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </td>
                    <td className="p-3 font-mono text-sm text-gray-600">{m.seq}</td>
                    <td className="p-3 font-medium text-blue-700">{m.subject}</td>
                    <td className="p-3 text-sm text-gray-500">{new Date(m.time).toLocaleString()}</td>
                    <td className="p-3 text-sm text-gray-600 font-mono truncate max-w-[200px]">
                      {m.payload ? m.payload.substring(0, 50) + (m.payload.length > 50 ? '...' : '') : '<empty>'}
                    </td>
                  </tr>
                  
                  {expandedId === m.seq && (
                    <tr className="bg-gray-50 border-b">
                      <td colSpan={5} className="p-0">
                        <div className="p-4 border-l-4 border-blue-500 m-4 bg-white rounded shadow-sm">
                          {m.headers && m.headers.length > 0 && (
                            <div className="mb-4">
                              <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Headers</h4>
                              <div className="bg-gray-100 p-2 rounded text-sm font-mono flex flex-col gap-1">
                                {m.headers.map((h: any, i: number) => (
                                  <div key={i}><span className="font-semibold text-gray-700">{h.key}:</span> {h.value}</div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="text-xs font-bold text-gray-500 uppercase">Payload</h4>
                              <button 
                                onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(formatPayload(m.payload)); }}
                                className="text-xs text-blue-600 flex items-center gap-1 hover:underline"
                              >
                                <Download size={12} /> Copy
                              </button>
                            </div>
                            <pre className="bg-gray-900 text-gray-100 p-3 rounded text-sm font-mono overflow-auto max-h-[400px]">
                              {formatPayload(m.payload)}
                            </pre>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
