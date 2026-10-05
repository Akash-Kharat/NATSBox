import React, { useState, useEffect } from 'react';
import { useLoadTestStore } from '../../stores/loadTestStore';
import { useConnectionStore } from '../../stores/connectionStore';
import { LoadTestConfig } from '../../../shared/types';
import { v4 as uuid } from 'uuid';
import { Save, X, Activity, Server, Target, Zap, Settings2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LoadTestFormProps {
  initialConfig?: LoadTestConfig | null;
  onSave: () => void;
  onCancel: () => void;
}

export const LoadTestForm: React.FC<LoadTestFormProps> = ({ initialConfig, onSave, onCancel }) => {
  const store = useLoadTestStore();
  const connStore = useConnectionStore();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<LoadTestConfig>({
    id: uuid(),
    name: 'Stress Test Profile',
    connectionId: '',
    type: 'publish',
    subject: 'test.stream',
    payloadTemplate: '{\n  "id": "{{uuid}}",\n  "timestamp": "{{timestamp}}",\n  "index": {{index}},\n  "data": "Sample payload data"\n}',
    payloadEncoding: 'json',
    totalMessages: 100000,
    ratePerSecond: 5000,
    concurrency: 10,
    timeoutMs: 30000,
    useJetStream: false
  });

  useEffect(() => {
    connStore.loadConnections();
    if (initialConfig) {
      setFormData({
        ...initialConfig,
        ratePerSecond: initialConfig.ratePerSecond || (initialConfig as any).ratePerSec || 1000
      });
    } else if (connStore.connections.length > 0) {
      setFormData(prev => ({ ...prev, connectionId: connStore.connections[0].id }));
    }
  }, [initialConfig]);

  const handleChange = (field: keyof LoadTestConfig, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await store.saveConfig(formData);
    onSave();
  };

  return (
    <div className="flex flex-col h-full bg-[#f8f9fa]">
      <div className="bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
            <Activity className="text-indigo-600" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{initialConfig ? 'Edit Load Test Profile' : 'New Load Test Profile'}</h1>
            <p className="text-sm text-gray-500">Configure stress testing parameters for your NATS infrastructure</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            type="button" 
            onClick={onCancel} 
            className="px-4 py-2 bg-white border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <X size={16} /> Cancel
          </button>
          <button 
            type="button" 
            onClick={handleSubmit} 
            className="px-4 py-2 bg-indigo-600 rounded text-sm font-medium text-white hover:bg-indigo-700 shadow-sm transition-colors flex items-center gap-2"
          >
            <Save size={16} /> Save Profile
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <form id="loadtest-form" onSubmit={handleSubmit} className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Core Settings */}
          <div className="lg:col-span-1 space-y-6">
            
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                <Settings2 size={16} className="text-gray-500" />
                <h3 className="font-semibold text-gray-700 text-sm">General Settings</h3>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Profile Name</label>
                  <input 
                    type="text" required 
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    value={formData.name}
                    onChange={e => handleChange('name', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Target Connection</label>
                  <select 
                    required
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
                    value={formData.connectionId}
                    onChange={e => handleChange('connectionId', e.target.value)}
                  >
                    <option value="" disabled>Select a connection</option>
                    {connStore.connections.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Test Mode</label>
                  <select 
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
                    value={formData.type}
                    onChange={e => handleChange('type', e.target.value as any)}
                  >
                    <option value="publish">Publish Only (Throughput)</option>
                    <option value="subscribe">Subscribe Only (Drain)</option>
                    <option value="request-reply">Request / Reply (Latency)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                <Target size={16} className="text-gray-500" />
                <h3 className="font-semibold text-gray-700 text-sm">Subject Routing</h3>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Target Subject</label>
                  <input 
                    type="text" required 
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-indigo-700"
                    value={formData.subject}
                    onChange={e => handleChange('subject', e.target.value)}
                  />
                </div>
                
                <label className="flex items-center gap-2 mt-4 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.useJetStream}
                    onChange={e => handleChange('useJetStream', e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Use JetStream Publish</span>
                </label>
              </div>
            </div>

          </div>

          {/* Right Column - Workload & Payload */}
          <div className="lg:col-span-2 space-y-6">
            
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-indigo-50/50 border-b border-indigo-100 flex items-center gap-2">
                <Zap size={16} className="text-indigo-600" />
                <h3 className="font-semibold text-indigo-900 text-sm">Workload Profile</h3>
              </div>
              <div className="p-5 grid grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Total Messages</label>
                  <input 
                    type="number" required min="1"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none font-mono"
                    value={formData.totalMessages}
                    onChange={e => handleChange('totalMessages', parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Rate (msgs / sec)</label>
                  <input 
                    type="number" required min="1"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none font-mono"
                    value={formData.ratePerSecond}
                    onChange={e => handleChange('ratePerSecond', parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Concurrency</label>
                  <input 
                    type="number" required min="1" max="100"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none font-mono"
                    value={formData.concurrency}
                    onChange={e => handleChange('concurrency', parseInt(e.target.value))}
                  />
                </div>

                {formData.type === 'request-reply' && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Timeout (ms)</label>
                    <input 
                      type="number" required min="100"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none font-mono"
                      value={formData.timeoutMs}
                      onChange={e => handleChange('timeoutMs', parseInt(e.target.value))}
                    />
                  </div>
                )}
              </div>
            </div>

            {(formData.type === 'publish' || formData.type === 'request-reply') && (
              <div className="bg-[#1e1e1e] rounded-lg shadow-sm overflow-hidden flex flex-col h-[400px]">
                <div className="px-4 py-3 bg-[#252526] border-b border-[#333] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server size={16} className="text-gray-400" />
                    <h3 className="font-medium text-gray-200 text-sm">Payload Template</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 font-mono">Format:</span>
                    <select 
                      className="text-xs bg-[#333] border border-[#444] rounded text-gray-200 px-2 py-1 outline-none"
                      value={formData.payloadEncoding}
                      onChange={e => handleChange('payloadEncoding', e.target.value as any)}
                    >
                      <option value="json">JSON</option>
                      <option value="utf8">Plain Text</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex-1 flex flex-col relative">
                  <textarea 
                    className="w-full flex-1 bg-transparent text-gray-300 p-4 font-mono text-sm resize-none focus:outline-none custom-scrollbar"
                    value={formData.payloadTemplate}
                    onChange={e => handleChange('payloadTemplate', e.target.value)}
                    spellCheck={false}
                  />
                  <div className="bg-[#007acc] text-white text-xs py-1.5 px-4 font-mono flex gap-4">
                    <span>Variables available:</span>
                    <span className="opacity-80">{'{{uuid}}'}</span>
                    <span className="opacity-80">{'{{timestamp}}'}</span>
                    <span className="opacity-80">{'{{index}}'}</span>
                  </div>
                </div>
              </div>
            )}

          </div>
        </form>
      </div>
    </div>
  );
};
