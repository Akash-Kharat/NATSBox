import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, X, Trash2, Server, Key, Settings, Shield, Activity, RefreshCw } from 'lucide-react';
import { useConnectionStore } from '../../stores/connectionStore';

export const ConnectionForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { connections, addConnection, updateConnection, deleteConnection } = useConnectionStore();
  
  const isEdit = !!id && id !== 'new';
  const existingConfig = isEdit ? connections.find((c: any) => c.id === id) : null;

  const [formData, setFormData] = useState<any>({
    name: 'Local NATS',
    protocol: 'nats',
    servers: 'localhost:4222',
    authType: 'none',
    token: '',
    username: '',
    password: '',
    nkeySeed: '',
    credsFile: '',
    reconnect: true,
    maxReconnectAttempts: -1,
    reconnectTimeWait: 2000,
    tlsRejectUnauthorized: true,
    caCert: '',
    clientCert: '',
    clientKey: '',
  });

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{success?: boolean, message?: string} | null>(null);

  useEffect(() => {
    if (existingConfig) {
      setFormData({
        ...existingConfig,
        name: existingConfig.name || 'Local NATS',
        protocol: existingConfig.protocol || 'nats',
        servers: Array.isArray(existingConfig.servers) 
          ? existingConfig.servers.join(', ') 
          : (existingConfig.servers || 'localhost:4222'),
        authType: existingConfig.auth?.type || existingConfig.authType || 'none',
        token: existingConfig.auth?.token || existingConfig.token || '',
        username: existingConfig.auth?.username || existingConfig.username || '',
        password: existingConfig.auth?.password || existingConfig.password || '',
        nkeySeed: existingConfig.auth?.nkeySeed || existingConfig.nkeySeed || '',
        credsFile: existingConfig.auth?.credsFile || existingConfig.credsFile || '',
        tlsRejectUnauthorized: existingConfig.tlsConfig?.rejectUnauthorized ?? existingConfig.tlsRejectUnauthorized ?? true,
        caCert: existingConfig.tlsConfig?.caFile || existingConfig.caCert || '',
        clientCert: existingConfig.tlsConfig?.certFile || existingConfig.clientCert || '',
        clientKey: existingConfig.tlsConfig?.keyFile || existingConfig.clientKey || '',
        maxReconnectAttempts: existingConfig.maxReconnectAttempts ?? -1,
        reconnectTimeWait: existingConfig.reconnectTimeWait ?? 2000,
      });
    }
  }, [existingConfig]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as any;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev: any) => ({ ...prev, [name]: val }));
  };

  const buildConfig = () => {
    const serverList = (formData.servers || 'localhost:4222')
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean);

    const isTls = formData.protocol === 'tls' || formData.protocol === 'wss';

    return {
      ...formData,
      id: isEdit ? id! : (existingConfig?.id || Math.random().toString(36).substring(7)),
      name: formData.name?.trim() || 'NATS Connection',
      protocol: formData.protocol || 'nats',
      servers: serverList.length > 0 ? serverList : ['localhost:4222'],
      auth: {
        type: formData.authType || 'none',
        token: formData.token || undefined,
        username: formData.username || undefined,
        password: formData.password || undefined,
        nkeySeed: formData.nkeySeed || undefined,
        credsFile: formData.credsFile || undefined,
      },
      tlsConfig: isTls ? {
        rejectUnauthorized: formData.tlsRejectUnauthorized,
        caFile: formData.caCert || undefined,
        certFile: formData.clientCert || undefined,
        keyFile: formData.clientKey || undefined,
      } : undefined,
      maxReconnectAttempts: Number(formData.maxReconnectAttempts) || -1,
      reconnectTimeWait: Number(formData.reconnectTimeWait) || 2000,
      pingInterval: 30,
      maxPingOut: 3,
      publishers: existingConfig?.publishers || [],
      subscribers: existingConfig?.subscribers || []
    };
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const config = buildConfig();
      // Test by actually invoking connect, then disconnect
      if (typeof window !== 'undefined' && (window as any).natsAPI?.connect) {
        // Quick temp ID so it doesn't mess with store state
        const tempId = `test-${Date.now()}`;
        await (window as any).natsAPI.connect({ ...config, id: tempId });
        await (window as any).natsAPI.disconnect(tempId);
        setTestResult({ success: true, message: 'Successfully connected!' });
      } else {
        throw new Error('NATS API unavailable');
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err?.message || 'Connection failed' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    try {
      const configToSave = buildConfig();
      if (isEdit) {
        await updateConnection(id!, configToSave);
      } else {
        await addConnection(configToSave);
      }
      navigate('/');
    } catch (err: any) {
      console.error('Save connection failed:', err);
      navigate('/');
    }
  };

  const handleDelete = () => {
    if (isEdit && window.confirm('Are you sure you want to delete this connection?')) {
      deleteConnection(id!);
      navigate('/');
    }
  };

  const isTls = formData.protocol === 'tls' || formData.protocol === 'wss';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-gray-900/40 backdrop-blur-sm transition-opacity">
      <div 
        className="w-full max-w-lg h-full bg-white shadow-2xl flex flex-col transform transition-transform border-l border-gray-200 animate-in slide-in-from-right-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50/50 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-800">{isEdit ? 'Edit Connection' : 'New Connection'}</h2>
          <div className="flex items-center gap-2">
            {isEdit && (
              <button onClick={handleDelete} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete connection">
                <Trash2 size={18} />
              </button>
            )}
            <button onClick={() => navigate('/')} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-md transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar bg-white">
          
          {/* Connection */}
          <section>
            <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Server size={16} className="text-blue-500" /> Connection
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1">Connection Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="e.g. Production Cluster" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-[13px] font-medium text-gray-700 mb-1">Protocol</label>
                  <select name="protocol" value={formData.protocol} onChange={handleChange} className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
                    <option value="nats">nats://</option>
                    <option value="tls">tls://</option>
                    <option value="ws">ws://</option>
                    <option value="wss">wss://</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[13px] font-medium text-gray-700 mb-1">Servers</label>
                  <input type="text" name="servers" value={formData.servers} onChange={handleChange} className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono" placeholder="localhost:4222" />
                </div>
              </div>
              <p className="text-xs text-gray-500">Comma separate multiple server addresses.</p>
            </div>
          </section>

          <hr className="border-gray-100" />

          {/* Authentication */}
          <section>
            <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Key size={16} className="text-blue-500" /> Authentication
            </h3>
            <div className="space-y-4">
              <div>
                <select name="authType" value={formData.authType} onChange={handleChange} className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
                  <option value="none">None</option>
                  <option value="token">Token</option>
                  <option value="userpass">Username & Password</option>
                  <option value="nkey">NKey</option>
                  <option value="creds">Credentials File</option>
                </select>
              </div>

              {formData.authType === 'token' && (
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1">Token</label>
                  <input type="password" name="token" value={formData.token} onChange={handleChange} className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm font-mono" />
                </div>
              )}

              {formData.authType === 'userpass' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 mb-1">Username</label>
                    <input type="text" name="username" value={formData.username} onChange={handleChange} className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm" />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 mb-1">Password</label>
                    <input type="password" name="password" value={formData.password} onChange={handleChange} className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm font-mono" />
                  </div>
                </div>
              )}

              {formData.authType === 'nkey' && (
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1">NKey Seed</label>
                  <input type="password" name="nkeySeed" value={formData.nkeySeed} onChange={handleChange} className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm font-mono" />
                </div>
              )}

              {formData.authType === 'creds' && (
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1">Credentials File Path</label>
                  <input type="text" name="credsFile" value={formData.credsFile} onChange={handleChange} className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm font-mono" placeholder="/path/to/user.creds" />
                </div>
              )}
            </div>
          </section>

          {/* TLS */}
          {isTls && (
            <>
              <hr className="border-gray-100" />
              <section>
                <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Shield size={16} className="text-blue-500" /> TLS Configuration
                </h3>
                <div className="space-y-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="tlsRejectUnauthorized" checked={formData.tlsRejectUnauthorized} onChange={handleChange} className="rounded text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm text-gray-700">Verify Server Certificate (Reject Unauthorized)</span>
                  </label>
                  
                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 mb-1">CA Certificate Path (Optional)</label>
                    <input type="text" name="caCert" value={formData.caCert} onChange={handleChange} className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm font-mono text-xs" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[13px] font-medium text-gray-700 mb-1">Client Cert Path</label>
                      <input type="text" name="clientCert" value={formData.clientCert} onChange={handleChange} className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm font-mono text-xs" />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-gray-700 mb-1">Client Key Path</label>
                      <input type="text" name="clientKey" value={formData.clientKey} onChange={handleChange} className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm font-mono text-xs" />
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}

          <hr className="border-gray-100" />

          {/* Advanced */}
          <section>
            <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Settings size={16} className="text-gray-500" /> Advanced Options
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1">Max Reconnects</label>
                  <input type="number" name="maxReconnectAttempts" value={formData.maxReconnectAttempts} onChange={handleChange} className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm" />
                  <p className="text-[11px] text-gray-400 mt-1">-1 for infinite.</p>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1">Reconnect Wait (ms)</label>
                  <input type="number" name="reconnectTimeWait" value={formData.reconnectTimeWait} onChange={handleChange} className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm" />
                </div>
              </div>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center flex-1 mr-4">
            <button 
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-1.5"
            >
              {isTesting ? <RefreshCw size={14} className="animate-spin" /> : <Activity size={14} />}
              Test Connection
            </button>
            {testResult && (
              <span className={`ml-3 text-xs font-medium ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
                {testResult.success ? '✓ ' : '✕ '}
                {testResult.message}
              </span>
            )}
          </div>
          
          <div className="flex gap-2">
            <button onClick={() => navigate('/')} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-1.5">
              <Save size={16} /> {isEdit ? 'Save Changes' : 'Add Connection'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
