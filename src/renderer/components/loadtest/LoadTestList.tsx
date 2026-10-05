import React, { useEffect } from 'react';
import { useLoadTestStore } from '../../stores/loadTestStore';
import { Play, Edit, Trash2, Plus, Activity } from 'lucide-react';
import { LoadTestConfig } from '../../../shared/types';

interface LoadTestListProps {
  onCreateNew: () => void;
  onEdit: (config: LoadTestConfig) => void;
  onRun: (config: LoadTestConfig) => void;
}

export const LoadTestList: React.FC<LoadTestListProps> = ({ onCreateNew, onEdit, onRun }) => {
  const store = useLoadTestStore();

  useEffect(() => {
    store.loadConfigs();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this test configuration?')) {
      await store.deleteConfig(id);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <Activity className="mr-2" /> Load Tests
        </h2>
        <button 
          onClick={onCreateNew}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm"
        >
          <Plus size={18} className="mr-2" /> Create Load Test
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {store.configs.map((config) => (
          <div key={config.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-5">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-lg truncate pr-2">{config.name}</h3>
                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded uppercase font-semibold">
                  {config.type}
                </span>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600 mb-6">
                <div className="flex justify-between">
                  <span>Subject:</span>
                  <span className="font-mono truncate ml-2 max-w-[150px]">{config.subject}</span>
                </div>
                <div className="flex justify-between">
                  <span>Rate:</span>
                  <span className="font-mono">{config.ratePerSec}/sec</span>
                </div>
                <div className="flex justify-between">
                  <span>Total:</span>
                  <span className="font-mono">{config.totalMessages}</span>
                </div>
                <div className="flex justify-between">
                  <span>Concurrency:</span>
                  <span className="font-mono">{config.concurrency}</span>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-gray-100">
                <button 
                  onClick={() => onRun(config)}
                  className="flex items-center text-green-600 hover:text-green-700 font-medium"
                >
                  <Play size={16} className="mr-1" /> Run Test
                </button>
                <div className="flex space-x-3 text-gray-400">
                  <button onClick={() => onEdit(config)} className="hover:text-blue-500">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => handleDelete(config.id)} className="hover:text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {store.configs.length === 0 && (
          <div className="col-span-full p-10 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <p className="text-gray-500">No load test configurations found. Create one to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};
