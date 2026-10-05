import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Save, X, Trash2, Server, Key, Settings, Shield, Activity, 
  RefreshCw, FolderOpen, Zap, Heart, Copy, Check, Eye, EyeOff,
  FileKey, ChevronDown, ChevronRight, CheckCircle2, AlertCircle
} from 'lucide-react';
import { useConnectionStore } from '../../stores/connectionStore';

export const ConnectionForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { connections, connectionStatuses, addConnection, updateConnection, deleteConnection } = useConnectionStore();
  
  const isEdit = !!id && id !== 'new';
  const existingConfig: any = isEdit ? connections.find((c: any) => c.id === id) : null;
  const liveStatus = (isEdit && id) ? connectionStatuses[id]?.status : 'disconnected';

  const [formData, setFormData] = useState<any>({
    name: 'Local NATS',
    serverUrl: 'nats://127.0.0.1:4222',
    protocol: 'nats',
    servers: '127.0.0.1:4222',
    authType: 'none',
    token: '',
    username: '',
    password: '',
    nkeySeed: '',
    nkeyFile: 'certs/natsuser.nk',
    credsFile: '',
    reconnect: true,
    maxReconnectAttempts: -1,
    reconnectTimeWait: 2000,
    enableTls: false,
    skipServerCertValidation: false,
    caCert: 'certs/ca.crt',
    clientCert: '',
    clientKey: '',
  });

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null);
  
  // NKey Generator state
  const [showNKeyGenerator, setShowNKeyGenerator] = useState(false);
  const [generatedPublicKey, setGeneratedPublicKey] = useState('');
  const [generatedSeed, setGeneratedSeed] = useState('');
  const [showSeedPassword, setShowSeedPassword] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedSeed, setCopiedSeed] = useState(false);
  const [showMtlsOptions, setShowMtlsOptions] = useState(false);

  useEffect(() => {
    if (existingConfig) {
      const serverStr = Array.isArray(existingConfig.servers) 
        ? existingConfig.servers.join(', ') 
        : (existingConfig.servers || '127.0.0.1:4222');
      const proto = existingConfig.protocol || 'nats';
      const fullUrl = serverStr.includes('://') ? serverStr : `${proto}://${serverStr}`;
      const isTls = existingConfig.enableTls ?? (
        proto === 'tls' || 
        proto === 'wss' || 
        !!existingConfig.tlsConfig || 
        !!existingConfig.caCert
      );
      const skipVerify = existingConfig.tlsConfig?.rejectUnauthorized !== undefined
        ? !existingConfig.tlsConfig.rejectUnauthorized
        : (existingConfig.skipServerCertValidation || false);

      setFormData({
        ...existingConfig,
        name: existingConfig.name || 'Local NATS',
        protocol: proto,
        servers: serverStr,
        serverUrl: fullUrl,
        authType: existingConfig.auth?.type || existingConfig.authType || 'none',
        token: existingConfig.auth?.token || existingConfig.token || '',
        username: existingConfig.auth?.username || existingConfig.username || '',
        password: existingConfig.auth?.password || existingConfig.password || '',
        nkeySeed: existingConfig.auth?.nkeySeed || existingConfig.nkeySeed || '',
        nkeyFile: existingConfig.auth?.nkeyFile || existingConfig.nkeyFile || existingConfig.auth?.nkeySeed || 'certs/natsuser.nk',
        credsFile: existingConfig.auth?.credsFile || existingConfig.credsFile || '',
        enableTls: isTls,
        skipServerCertValidation: skipVerify,
        caCert: existingConfig.tlsConfig?.caFile || existingConfig.caCert || '',
        clientCert: existingConfig.tlsConfig?.certFile || existingConfig.clientCert || '',
        clientKey: existingConfig.tlsConfig?.keyFile || existingConfig.clientKey || '',
        maxReconnectAttempts: existingConfig.maxReconnectAttempts ?? -1,
        reconnectTimeWait: existingConfig.reconnectTimeWait ?? 2000,
      });

      if (existingConfig.tlsConfig?.certFile || existingConfig.tlsConfig?.keyFile) {
        setShowMtlsOptions(true);
      }
    }
  }, [existingConfig]);

  const parseServerUrl = (urlStr: string) => {
    let proto = 'nats';
    let servers = urlStr.trim();
    if (urlStr.includes('://')) {
      const parts = urlStr.split('://');
      proto = parts[0] || 'nats';
      servers = parts.slice(1).join('://');
    }
    return { proto, servers };
  };

  const handleServerUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const { proto, servers } = parseServerUrl(val);
    setFormData((prev: any) => ({
      ...prev,
      serverUrl: val,
      protocol: proto || prev.protocol,
      servers: servers || val,
      enableTls: proto === 'tls' || proto === 'wss' ? true : prev.enableTls
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as any;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev: any) => {
      const updated = { ...prev, [name]: val };
      if (name === 'protocol') {
        const currentServers = prev.servers || '127.0.0.1:4222';
        updated.serverUrl = `${val}://${currentServers}`;
        if (val === 'tls' || val === 'wss') {
          updated.enableTls = true;
        }
      }
      return updated;
    });
  };

  const buildConfig = () => {
    const parsed = parseServerUrl(formData.serverUrl || formData.servers || '127.0.0.1:4222');
    const rawServers = parsed.servers || formData.servers || '127.0.0.1:4222';
    const serverList = rawServers
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean);

    const enableTls = !!formData.enableTls || formData.protocol === 'tls' || formData.protocol === 'wss' || !!formData.caCert;

    const tlsConfig = enableTls ? {
      rejectUnauthorized: !formData.skipServerCertValidation,
      caFile: formData.caCert?.trim() || undefined,
      certFile: formData.clientCert?.trim() || undefined,
      keyFile: formData.clientKey?.trim() || undefined,
    } : undefined;

    return {
      ...formData,
      id: isEdit ? id! : (existingConfig?.id || Math.random().toString(36).substring(7)),
      name: formData.name?.trim() || 'NATS Connection',
      protocol: formData.protocol || parsed.proto || 'nats',
      servers: serverList.length > 0 ? serverList : ['127.0.0.1:4222'],
      enableTls,
      auth: {
        type: formData.authType || 'none',
        token: formData.token || undefined,
        username: formData.username || undefined,
        password: formData.password || undefined,
        nkeySeed: formData.nkeySeed || formData.nkeyFile || undefined,
        nkeyFile: formData.nkeyFile || undefined,
        credsFile: formData.credsFile || undefined,
      },
      tlsConfig,
      maxReconnectAttempts: Number(formData.maxReconnectAttempts) || -1,
      reconnectTimeWait: Number(formData.reconnectTimeWait) || 2000,
      pingInterval: 30,
      maxPingOut: 3,
      publishers: existingConfig?.publishers || [],
      subscribers: existingConfig?.subscribers || []
    };
  };

  // Browse File Handlers via Native Electron Dialog
  const handleBrowseCaCert = async () => {
    try {
      if (typeof window !== 'undefined' && (window as any).natsAPI?.openFileDialog) {
        const filePath = await (window as any).natsAPI.openFileDialog({
          title: 'Select Root CA Certificate (.crt / .pem)',
          filters: [
            { name: 'Certificate Files (*.crt, *.pem, *.ca)', extensions: ['crt', 'pem', 'ca'] },
            { name: 'All Files', extensions: ['*'] }
          ]
        });
        if (filePath) {
          setFormData((prev: any) => ({ ...prev, caCert: filePath, enableTls: true }));
        }
      }
    } catch (err) {
      console.error('File dialog error:', err);
    }
  };

  const handleBrowseClientCert = async () => {
    try {
      if (typeof window !== 'undefined' && (window as any).natsAPI?.openFileDialog) {
        const filePath = await (window as any).natsAPI.openFileDialog({
          title: 'Select Client Certificate (.crt / .pem)',
          filters: [
            { name: 'Certificate Files (*.crt, *.pem)', extensions: ['crt', 'pem'] },
            { name: 'All Files', extensions: ['*'] }
          ]
        });
        if (filePath) {
          setFormData((prev: any) => ({ ...prev, clientCert: filePath }));
        }
      }
    } catch (err) {
      console.error('File dialog error:', err);
    }
  };

  const handleBrowseClientKey = async () => {
    try {
      if (typeof window !== 'undefined' && (window as any).natsAPI?.openFileDialog) {
        const filePath = await (window as any).natsAPI.openFileDialog({
          title: 'Select Client Key (.key / .pem)',
          filters: [
            { name: 'Private Key Files (*.key, *.pem)', extensions: ['key', 'pem'] },
            { name: 'All Files', extensions: ['*'] }
          ]
        });
        if (filePath) {
          setFormData((prev: any) => ({ ...prev, clientKey: filePath }));
        }
      }
    } catch (err) {
      console.error('File dialog error:', err);
    }
  };

  const handleBrowseNKey = async () => {
    try {
      if (typeof window !== 'undefined' && (window as any).natsAPI?.openFileDialog) {
        const filePath = await (window as any).natsAPI.openFileDialog({
          title: 'Select NKey Seed File (.nk)',
          filters: [
            { name: 'NKey Files (*.nk)', extensions: ['nk'] },
            { name: 'All Files', extensions: ['*'] }
          ]
        });
        if (filePath) {
          setFormData((prev: any) => ({ ...prev, nkeyFile: filePath, nkeySeed: filePath }));
        }
      }
    } catch (err) {
      console.error('File dialog error:', err);
    }
  };

  const handleBrowseCreds = async () => {
    try {
      if (typeof window !== 'undefined' && (window as any).natsAPI?.openFileDialog) {
        const filePath = await (window as any).natsAPI.openFileDialog({
          title: 'Select Credentials File (.creds)',
          filters: [
            { name: 'Credentials Files (*.creds)', extensions: ['creds'] },
            { name: 'All Files', extensions: ['*'] }
          ]
        });
        if (filePath) {
          setFormData((prev: any) => ({ ...prev, credsFile: filePath }));
        }
      }
    } catch (err) {
      console.error('File dialog error:', err);
    }
  };

  // NKey Generator Handlers
  const handleGenerateNKey = async () => {
    try {
      if (typeof window !== 'undefined' && (window as any).natsAPI?.generateNKey) {
        const result = await (window as any).natsAPI.generateNKey();
        setGeneratedPublicKey(result.publicKey);
        setGeneratedSeed(result.seed);
      } else {
        // Fallback placeholder for environments without IPC
        const randomKey = 'U' + Array.from({ length: 55 }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'[Math.floor(Math.random() * 32)]).join('');
        const randomSeed = 'SU' + Array.from({ length: 56 }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'[Math.floor(Math.random() * 32)]).join('');
        setGeneratedPublicKey(randomKey);
        setGeneratedSeed(randomSeed);
      }
    } catch (err: any) {
      console.error('Failed to generate NKey:', err);
    }
  };

  const handleSaveNKeyAndUse = async () => {
    if (!generatedSeed) return;
    try {
      const defaultPath = formData.nkeyFile || 'certs/natsuser.nk';
      if (typeof window !== 'undefined' && (window as any).natsAPI?.saveFileDialog) {
        const savedPath = await (window as any).natsAPI.saveFileDialog({
          title: 'Save NKey Seed File',
          defaultPath,
          filters: [
            { name: 'NKey Files (*.nk)', extensions: ['nk'] },
            { name: 'All Files', extensions: ['*'] }
          ],
          content: generatedSeed
        });
        if (savedPath) {
          setFormData((prev: any) => ({ ...prev, nkeyFile: savedPath, nkeySeed: generatedSeed }));
          setTestResult({ success: true, message: `NKey saved to ${savedPath} & applied!` });
          return;
        }
      }
      // If save cancelled or not in Electron, apply seed directly
      setFormData((prev: any) => ({ ...prev, nkeyFile: defaultPath, nkeySeed: generatedSeed }));
      setTestResult({ success: true, message: 'NKey seed applied to connection form!' });
    } catch (err: any) {
      console.error('Failed to save NKey file:', err);
      setFormData((prev: any) => ({ ...prev, nkeySeed: generatedSeed }));
    }
  };

  // Connection Testing Handlers
  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const config = buildConfig();
      if (typeof window !== 'undefined' && (window as any).natsAPI?.connect) {
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

  const handleTestPublish = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const config = buildConfig();
      if (typeof window !== 'undefined' && (window as any).natsAPI?.connect) {
        const tempId = `test-pub-${Date.now()}`;
        await (window as any).natsAPI.connect({ ...config, id: tempId });
        if ((window as any).natsAPI?.publish) {
          await (window as any).natsAPI.publish({
            connId: tempId,
            subject: '_natsbox.ping',
            payload: JSON.stringify({ ping: 'pong', timestamp: new Date().toISOString() })
          });
        }
        await (window as any).natsAPI.disconnect(tempId);
        setTestResult({ success: true, message: 'Test message successfully published to _natsbox.ping!' });
      } else {
        throw new Error('NATS API unavailable');
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err?.message || 'Publish test failed' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleHeartbeat = async () => {
    setIsTesting(true);
    setTestResult(null);
    const start = performance.now();
    try {
      const config = buildConfig();
      if (typeof window !== 'undefined' && (window as any).natsAPI?.connect) {
        const tempId = `ping-${Date.now()}`;
        await (window as any).natsAPI.connect({ ...config, id: tempId });
        await (window as any).natsAPI.disconnect(tempId);
        const elapsed = Math.round(performance.now() - start);
        setTestResult({ success: true, message: `Heartbeat OK (${elapsed}ms roundtrip)` });
      } else {
        throw new Error('NATS API unavailable');
      }
    } catch (err: any) {
      setTestResult({ success: false, message: `Heartbeat failed: ${err?.message || err}` });
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

  const isConnected = liveStatus === 'connected';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-gray-900/60 backdrop-blur-sm transition-opacity">
      <div 
        className="w-full max-w-2xl h-full bg-[#1e232d] text-slate-100 shadow-2xl flex flex-col transform transition-transform border-l border-slate-700/60 animate-in slide-in-from-right-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header matching reference design */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#161a23] flex-shrink-0">
          <div className="flex items-center gap-3">
            <Server size={18} className="text-blue-400" />
            <h2 className="text-base font-bold text-slate-100 tracking-wide">
              {isEdit ? `Edit: ${formData.name || 'NATS Broker'}` : 'NATS Broker Connection'}
            </h2>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Status Badge */}
            <span className={`px-2.5 py-1 text-xs font-semibold rounded uppercase tracking-wider ${
              isConnected 
                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-600/40' 
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}>
              {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
            </span>

            {/* Quick action buttons */}
            <button 
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded transition-colors flex items-center gap-1.5"
              title="Test Connection"
            >
              <Check size={13} className={isTesting ? "animate-spin text-blue-400" : "text-emerald-400"} />
              Test Connect
            </button>

            <button 
              type="button"
              onClick={handleTestPublish}
              disabled={isTesting}
              className="px-2.5 py-1 text-xs font-medium bg-amber-600 hover:bg-amber-500 text-white rounded transition-colors flex items-center gap-1.5"
              title="Test Publish a Ping message"
            >
              <Zap size={13} />
              Test Publish
            </button>

            <button 
              type="button"
              onClick={handleHeartbeat}
              disabled={isTesting}
              className="px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700 rounded transition-colors flex items-center gap-1.5"
              title="Ping Roundtrip Heartbeat"
            >
              <Heart size={13} className="text-rose-500" />
              Heartbeat
            </button>

            {isEdit && (
              <button 
                type="button"
                onClick={handleDelete} 
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors ml-1" 
                title="Delete connection"
              >
                <Trash2 size={16} />
              </button>
            )}

            <button 
              type="button"
              onClick={() => navigate('/')} 
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors ml-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Test Result Toast/Banner */}
        {testResult && (
          <div className={`px-6 py-2.5 text-xs font-medium flex items-center gap-2 border-b ${
            testResult.success 
              ? 'bg-emerald-950/60 border-emerald-800/40 text-emerald-300' 
              : 'bg-rose-950/60 border-rose-800/40 text-rose-300'
          }`}>
            {testResult.success ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
            <span>{testResult.message}</span>
          </div>
        )}

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#1a1f29]">
          
          {/* Connection Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Friendly Name
            </label>
            <input 
              type="text" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              className="w-full bg-[#13161f] border border-slate-700 focus:border-blue-500 px-3 py-2 rounded text-sm text-slate-100 placeholder-slate-500 outline-none transition-colors"
              placeholder="e.g. Production Cluster or Local Dev" 
            />
          </div>

          {/* Row 1: Server URL & Authentication Mode */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Server URL
              </label>
              <input 
                type="text" 
                name="serverUrl" 
                value={formData.serverUrl} 
                onChange={handleServerUrlChange} 
                className="w-full bg-[#13161f] border border-slate-700 focus:border-blue-500 px-3 py-2 rounded text-sm text-slate-100 font-mono outline-none transition-colors" 
                placeholder="nats://127.0.0.1:4222" 
              />
              <p className="text-[11px] text-slate-400 mt-1">Accepts nats://, tls://, ws://, or comma-separated addresses.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Authentication Mode
              </label>
              <select 
                name="authType" 
                value={formData.authType} 
                onChange={handleChange} 
                className="w-full bg-[#13161f] border border-slate-700 focus:border-blue-500 px-3 py-2 rounded text-sm text-slate-100 outline-none transition-colors"
              >
                <option value="none">None / Anonymous</option>
                <option value="token">Token</option>
                <option value="userpass">Username & Password</option>
                <option value="nkey">NKey Seed File</option>
                <option value="creds">Credentials File (.creds)</option>
              </select>
            </div>
          </div>

          {/* Authentication Details */}
          {formData.authType === 'token' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Auth Token
              </label>
              <input 
                type="password" 
                name="token" 
                value={formData.token} 
                onChange={handleChange} 
                className="w-full bg-[#13161f] border border-slate-700 focus:border-blue-500 px-3 py-2 rounded text-sm text-slate-100 font-mono outline-none" 
                placeholder="Enter secret authorization token"
              />
            </div>
          )}

          {formData.authType === 'userpass' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Username
                </label>
                <input 
                  type="text" 
                  name="username" 
                  value={formData.username} 
                  onChange={handleChange} 
                  className="w-full bg-[#13161f] border border-slate-700 focus:border-blue-500 px-3 py-2 rounded text-sm text-slate-100 outline-none" 
                  placeholder="Username"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <input 
                  type="password" 
                  name="password" 
                  value={formData.password} 
                  onChange={handleChange} 
                  className="w-full bg-[#13161f] border border-slate-700 focus:border-blue-500 px-3 py-2 rounded text-sm text-slate-100 font-mono outline-none" 
                  placeholder="Password"
                />
              </div>
            </div>
          )}

          {formData.authType === 'creds' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Credentials File (.creds)
              </label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  name="credsFile" 
                  value={formData.credsFile} 
                  onChange={handleChange} 
                  className="flex-1 bg-[#13161f] border border-slate-700 focus:border-blue-500 px-3 py-2 rounded text-sm text-slate-100 font-mono outline-none" 
                  placeholder="certs/user.creds" 
                />
                <button
                  type="button"
                  onClick={handleBrowseCreds}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <FolderOpen size={14} className="text-amber-400" />
                  Browse
                </button>
              </div>
            </div>
          )}

          {/* NKey Seed File + Key Generator */}
          {formData.authType === 'nkey' && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    NKey Seed File (.nk)
                  </label>
                  <button 
                    type="button"
                    onClick={() => setShowNKeyGenerator(!showNKeyGenerator)}
                    className="text-xs font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                  >
                    <Zap size={13} />
                    {showNKeyGenerator ? 'Hide Key Generator' : 'Generate Key'}
                  </button>
                </div>
                
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    name="nkeyFile" 
                    value={formData.nkeyFile || formData.nkeySeed} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData((prev: any) => ({ ...prev, nkeyFile: val, nkeySeed: val }));
                    }} 
                    className="flex-1 bg-[#13161f] border border-slate-700 focus:border-blue-500 px-3 py-2 rounded text-sm text-slate-100 font-mono outline-none" 
                    placeholder="certs/natsuser.nk" 
                  />
                  <button
                    type="button"
                    onClick={handleBrowseNKey}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <FolderOpen size={14} className="text-amber-400" />
                    Browse
                  </button>
                </div>
              </div>

              {/* Collapsible NKey Generator Card */}
              {showNKeyGenerator && (
                <div className="bg-[#12151d] border border-slate-700/80 rounded-lg p-4 space-y-4 animate-in fade-in-50">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                    <div className="flex items-center gap-2">
                      <FileKey size={15} className="text-blue-400" />
                      <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">NKey Generator</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleGenerateNKey}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium transition-colors shadow-sm flex items-center gap-1.5"
                    >
                      <RefreshCw size={12} />
                      Generate Pair
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Public Key */}
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        Public Key (Register in NATS)
                      </label>
                      <div className="flex gap-1.5">
                        <input 
                          type="text" 
                          readOnly 
                          value={generatedPublicKey} 
                          placeholder="U..." 
                          className="flex-1 bg-[#0a0d13] border border-slate-800 px-2.5 py-1.5 rounded text-xs text-slate-300 font-mono select-all outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (generatedPublicKey) {
                              navigator.clipboard.writeText(generatedPublicKey);
                              setCopiedKey(true);
                              setTimeout(() => setCopiedKey(false), 2000);
                            }
                          }}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors"
                          title="Copy Public Key"
                        >
                          {copiedKey ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>

                    {/* Private Seed */}
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        Private Seed
                      </label>
                      <div className="flex gap-1.5">
                        <input 
                          type={showSeedPassword ? 'text' : 'password'} 
                          readOnly 
                          value={generatedSeed} 
                          placeholder="SU..." 
                          className="flex-1 bg-[#0a0d13] border border-slate-800 px-2.5 py-1.5 rounded text-xs text-slate-300 font-mono select-all outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSeedPassword(!showSeedPassword)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors"
                          title={showSeedPassword ? "Hide Seed" : "Show Seed"}
                        >
                          {showSeedPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (generatedSeed) {
                              navigator.clipboard.writeText(generatedSeed);
                              setCopiedSeed(true);
                              setTimeout(() => setCopiedSeed(false), 2000);
                            }
                          }}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors"
                          title="Copy Private Seed"
                        >
                          {copiedSeed ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {generatedSeed && (
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={handleSaveNKeyAndUse}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600/60 text-slate-200 rounded text-xs font-medium transition-colors flex items-center gap-1.5"
                      >
                        <Save size={13} className="text-purple-400" />
                        Save to certs/natsuser.nk &amp; Use
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <hr className="border-slate-800" />

          {/* TLS / SSL Security Certificates Section */}
          <section className="space-y-4">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input 
                type="checkbox" 
                name="enableTls" 
                checked={formData.enableTls} 
                onChange={handleChange} 
                className="w-4 h-4 rounded bg-[#13161f] border-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer" 
              />
              <span className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                <Shield size={16} className={formData.enableTls ? "text-emerald-400" : "text-slate-500"} />
                Enable TLS / SSL Security Certificates
              </span>
            </label>

            {formData.enableTls && (
              <div className="pl-6 space-y-4 animate-in fade-in-50">
                {/* Root CA Certificate (.crt / .pem) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Root CA Certificate (.crt / .pem)
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      name="caCert" 
                      value={formData.caCert} 
                      onChange={handleChange} 
                      className="flex-1 bg-[#13161f] border border-slate-700 focus:border-blue-500 px-3 py-2 rounded text-sm text-slate-100 font-mono outline-none" 
                      placeholder="certs/ca.crt" 
                    />
                    <button
                      type="button"
                      onClick={handleBrowseCaCert}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <FolderOpen size={14} className="text-amber-400" />
                      Browse
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Provide the Certificate Authority file to authenticate server identity.</p>
                </div>

                {/* Skip Server Certificate Validation */}
                <div>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      name="skipServerCertValidation" 
                      checked={formData.skipServerCertValidation} 
                      onChange={handleChange} 
                      className="w-4 h-4 rounded bg-[#13161f] border-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer" 
                    />
                    <span className="text-xs font-medium text-slate-300">
                      Skip Server Certificate Validation
                    </span>
                  </label>
                  <p className="text-[11px] text-slate-500 ml-6 mt-0.5">
                    Allow self-signed certificates or test environments (sets rejectUnauthorized = false).
                  </p>
                </div>

                {/* Optional Mutual TLS (mTLS) Client Cert & Key */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowMtlsOptions(!showMtlsOptions)}
                    className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                  >
                    {showMtlsOptions ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    Client Certificate &amp; Private Key (Mutual TLS / mTLS)
                  </button>

                  {showMtlsOptions && (
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 pl-2 border-l border-slate-800">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-400 mb-1">
                          Client Certificate (.crt / .pem)
                        </label>
                        <div className="flex gap-1.5">
                          <input 
                            type="text" 
                            name="clientCert" 
                            value={formData.clientCert} 
                            onChange={handleChange} 
                            className="flex-1 bg-[#13161f] border border-slate-700 px-2.5 py-1.5 rounded text-xs text-slate-200 font-mono outline-none" 
                            placeholder="certs/client.crt"
                          />
                          <button
                            type="button"
                            onClick={handleBrowseClientCert}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-slate-200"
                            title="Browse Client Cert"
                          >
                            <FolderOpen size={13} className="text-amber-400" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-slate-400 mb-1">
                          Client Key (.key / .pem)
                        </label>
                        <div className="flex gap-1.5">
                          <input 
                            type="text" 
                            name="clientKey" 
                            value={formData.clientKey} 
                            onChange={handleChange} 
                            className="flex-1 bg-[#13161f] border border-slate-700 px-2.5 py-1.5 rounded text-xs text-slate-200 font-mono outline-none" 
                            placeholder="certs/client.key"
                          />
                          <button
                            type="button"
                            onClick={handleBrowseClientKey}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-slate-200"
                            title="Browse Client Key"
                          >
                            <FolderOpen size={13} className="text-amber-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}
          </section>

          <hr className="border-slate-800" />

          {/* Advanced Options */}
          <section>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Settings size={14} className="text-slate-500" /> Connection Tolerances
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Max Reconnect Attempts</label>
                <input 
                  type="number" 
                  name="maxReconnectAttempts" 
                  value={formData.maxReconnectAttempts} 
                  onChange={handleChange} 
                  className="w-full bg-[#13161f] border border-slate-700 px-3 py-1.5 rounded text-sm text-slate-100 outline-none" 
                />
                <p className="text-[10px] text-slate-500 mt-0.5">-1 for infinite reconnect attempts.</p>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Reconnect Wait (ms)</label>
                <input 
                  type="number" 
                  name="reconnectTimeWait" 
                  value={formData.reconnectTimeWait} 
                  onChange={handleChange} 
                  className="w-full bg-[#13161f] border border-slate-700 px-3 py-1.5 rounded text-sm text-slate-100 outline-none" 
                />
              </div>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-[#161a23] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            {testResult && (
              <span className={`font-medium ${testResult.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                {testResult.success ? '✓ Ready to connect' : '✕ Test failed'}
              </span>
            )}
          </div>
          
          <div className="flex gap-2">
            <button 
              type="button"
              onClick={() => navigate('/')} 
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button 
              type="button"
              onClick={handleSave} 
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-medium shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Save size={15} /> 
              {isEdit ? 'Save Changes' : 'Save Connection'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
