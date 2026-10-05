import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Users, RefreshCw } from 'lucide-react';
import { useJetStreamStore } from '../../stores/jetStreamStore';
import type { ConsumerConfig } from '../../../shared/types';

interface ConsumerListProps {
  connectionId: string;
  streamName: string;
}

export const ConsumerList: React.FC<ConsumerListProps> = ({ connectionId, streamName }) => {
  const { fetchConsumers, deleteConsumer, createConsumer } = useJetStreamStore();
  const [consumers, setConsumers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    durable_name: '',
    deliver_policy: 'all',
    ack_policy: 'explicit',
    replay_policy: 'instant',
    filter_subject: '',
    max_deliver: -1,
    ack_wait: 30000,
  });

  const loadConsumers = async () => {
    try {
      const res = await fetchConsumers(connectionId, streamName);
      setConsumers(res || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadConsumers();
  }, [connectionId, streamName]);

  const handleDelete = async (consumerName: string) => {
    if (window.confirm(`Delete consumer '${consumerName}'?`)) {
      await deleteConsumer(connectionId, streamName, consumerName);
      loadConsumers();
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const config = {
        durableName: formData.durable_name || undefined,
        deliverPolicy: formData.deliver_policy as ConsumerConfig['deliverPolicy'],
        ackPolicy: formData.ack_policy as ConsumerConfig['ackPolicy'],
        replayPolicy: formData.replay_policy as ConsumerConfig['replayPolicy'],
        filterSubject: formData.filter_subject || undefined,
        maxDeliver: Number(formData.max_deliver),
      };
      await createConsumer(connectionId, streamName, config);
      setShowForm(false);
      loadConsumers();
    } catch (err) {
      alert('Failed to create consumer: ' + String(err));
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Users className="text-blue-600" /> Consumers for '{streamName}'
        </h2>
        <div className="flex gap-2">
          <button onClick={loadConsumers} className="p-2 border rounded hover:bg-gray-50"><RefreshCw size={18} /></button>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            <Plus size={18} /> {showForm ? 'Cancel' : 'Create Consumer'}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-8 p-5 bg-gray-50 border rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="col-span-2"><h3 className="font-semibold mb-2">New Consumer Configuration</h3></div>
          
          <div>
            <label className="block text-sm mb-1">Durable Name (Optional)</label>
            <input type="text" value={formData.durable_name} onChange={e => setFormData({...formData, durable_name: e.target.value})} className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block text-sm mb-1">Filter Subject (Optional)</label>
            <input type="text" value={formData.filter_subject} onChange={e => setFormData({...formData, filter_subject: e.target.value})} className="w-full border p-2 rounded" placeholder="events.foo" />
          </div>
          
          <div>
            <label className="block text-sm mb-1">Deliver Policy</label>
            <select value={formData.deliver_policy} onChange={e => setFormData({...formData, deliver_policy: e.target.value})} className="w-full border p-2 rounded">
              <option value="all">All</option>
              <option value="last">Last</option>
              <option value="new">New</option>
              <option value="by_start_sequence">By Start Sequence</option>
              <option value="by_start_time">By Start Time</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Ack Policy</label>
            <select value={formData.ack_policy} onChange={e => setFormData({...formData, ack_policy: e.target.value})} className="w-full border p-2 rounded">
              <option value="explicit">Explicit</option>
              <option value="none">None</option>
              <option value="all">All</option>
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1">Replay Policy</label>
            <select value={formData.replay_policy} onChange={e => setFormData({...formData, replay_policy: e.target.value})} className="w-full border p-2 rounded">
              <option value="instant">Instant</option>
              <option value="original">Original</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Max Deliveries (-1 for unlim)</label>
            <input type="number" value={formData.max_deliver} onChange={e => setFormData({...formData, max_deliver: Number(e.target.value)})} className="w-full border p-2 rounded" />
          </div>
          
          <div className="col-span-2 flex justify-end mt-2">
            <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded font-medium hover:bg-blue-700">Create</button>
          </div>
        </form>
      )}

      {consumers.length === 0 ? (
        <div className="text-center p-8 text-gray-500 bg-gray-50 rounded border border-dashed">
          No consumers found for this stream.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-y text-sm text-gray-600">
                <th className="p-3">Name</th>
                <th className="p-3">Durable Name</th>
                <th className="p-3">Policy (Deliver/Ack)</th>
                <th className="p-3 text-right">Pending</th>
                <th className="p-3 text-right">Ack Pending</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {consumers.map((c: any) => (
                <tr key={c.name} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">{c.name}</td>
                  <td className="p-3 text-gray-500">{c.config.durable_name || '-'}</td>
                  <td className="p-3 text-sm">
                    <span className="capitalize">{c.config.deliver_policy}</span> / <span className="capitalize">{c.config.ack_policy}</span>
                  </td>
                  <td className="p-3 text-right text-gray-600">{c.num_pending}</td>
                  <td className="p-3 text-right text-gray-600">{c.num_ack_pending}</td>
                  <td className="p-3 text-center">
                    <button 
                      onClick={() => handleDelete(c.name)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                      title="Delete Consumer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
