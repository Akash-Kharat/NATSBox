import React, { useState } from 'react';
import { Save, X, Info } from 'lucide-react';
import { useJetStreamStore } from '../../stores/jetStreamStore';

/** Parses durations like 30s, 15m, 1h, 7d into nanoseconds. Empty/invalid = 0 (unlimited). */
function parseMaxAge(value: unknown): number {
  const m = /^\s*(\d+)\s*(s|m|h|d)\s*$/i.exec(String(value ?? ''));
  if (!m) return 0;
  const unitSeconds: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
  return Number(m[1]) * unitSeconds[m[2].toLowerCase()] * 1e9;
}

interface StreamFormProps {
  connectionId: string;
  onClose: () => void;
  editStream?: any;
}

export const StreamForm: React.FC<StreamFormProps> = ({ connectionId, onClose, editStream }) => {
  const { createStream } = useJetStreamStore();
  const isEdit = !!editStream;
  
  const [formData, setFormData] = useState({
    name: editStream?.config?.name || '',
    subjects: editStream?.config?.subjects?.join(', ') || '',
    retention: editStream?.config?.retention || 'limits',
    storage: editStream?.config?.storage || 'file',
    max_msgs: editStream?.config?.maxMsgs || -1,
    max_bytes: editStream?.config?.maxBytes || -1,
    max_age: '',
    max_msg_size: editStream?.config?.maxMsgSize || -1,
    discard: editStream?.config?.discard || 'old',
    replicas: editStream?.config?.replicas || 1,
    description: editStream?.config?.description || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const config = {
      name: formData.name,
      subjects: formData.subjects.split(',').map((s: string) => s.trim()).filter(Boolean),
      retention: formData.retention,
      storage: formData.storage,
      maxMsgs: Number(formData.max_msgs),
      maxBytes: Number(formData.max_bytes),
      maxAge: parseMaxAge(formData.max_age), 
      maxMsgSize: Number(formData.max_msg_size),
      discard: formData.discard,
      replicas: Number(formData.replicas),
      description: formData.description,
    };

    try {
      await createStream(connectionId, config);
      onClose();
    } catch (err) {
      alert('Failed to save stream: ' + String(err));
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg border shadow-sm max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{isEdit ? 'Edit Stream' : 'Create Stream'}</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-900"><X size={24} /></button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stream Name</label>
              <input required type="text" name="name" value={formData.name} onChange={handleChange} disabled={isEdit} className="w-full border p-2 rounded bg-gray-50 focus:bg-white" placeholder="ORDERS" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subjects (comma separated)</label>
              <input required type="text" name="subjects" value={formData.subjects} onChange={handleChange} className="w-full border p-2 rounded" placeholder="orders.*, events.>" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea name="description" value={formData.description} onChange={handleChange} className="w-full border p-2 rounded" rows={2} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Storage Type</label>
                <select name="storage" value={formData.storage} onChange={handleChange} className="w-full border p-2 rounded">
                  <option value="file">File</option>
                  <option value="memory">Memory</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Replicas</label>
                <input type="number" name="replicas" value={formData.replicas} onChange={handleChange} min={1} max={5} className="w-full border p-2 rounded" />
              </div>
            </div>
          </div>

          <div className="space-y-4 bg-gray-50 p-4 rounded border">
            <h3 className="font-semibold text-gray-700 flex items-center gap-1"><Info size={16} /> Stream Limits & Policy</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Retention Policy</label>
                <select name="retention" value={formData.retention} onChange={handleChange} className="w-full border p-2 rounded">
                  <option value="limits">Limits</option>
                  <option value="interest">Interest</option>
                  <option value="workqueue">WorkQueue</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discard Policy</label>
                <select name="discard" value={formData.discard} onChange={handleChange} className="w-full border p-2 rounded">
                  <option value="old">Old (Drop oldest)</option>
                  <option value="new">New (Reject new)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Messages (-1 for max)</label>
                <input type="number" name="max_msgs" value={formData.max_msgs} onChange={handleChange} className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Bytes (-1 for max)</label>
                <input type="number" name="max_bytes" value={formData.max_bytes} onChange={handleChange} className="w-full border p-2 rounded" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Age (e.g., 1h, 7d)</label>
                <input type="text" name="max_age" value={formData.max_age} onChange={handleChange} className="w-full border p-2 rounded" placeholder="1h" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Message Size (-1 for max)</label>
                <input type="number" name="max_msg_size" value={formData.max_msg_size} onChange={handleChange} className="w-full border p-2 rounded" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-50">Cancel</button>
          <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            <Save size={18} /> {isEdit ? 'Update Stream' : 'Create Stream'}
          </button>
        </div>
      </form>
    </div>
  );
};
