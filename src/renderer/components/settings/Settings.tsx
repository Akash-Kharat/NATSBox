import React from 'react';
import { Settings2, Download, Upload, Monitor, Moon, Sun, Database } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';

export const Settings: React.FC = () => {
  const { showSnackbar } = useUIStore();

  const handleExport = () => {
    showSnackbar('Configuration exported successfully', 'success');
  };

  const handleImport = () => {
    showSnackbar('Configuration imported successfully', 'success');
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings2 className="text-blue-600" />
          Settings
        </h1>
        <p className="text-gray-500 mt-1">Manage application preferences and data.</p>
      </div>

      <div className="space-y-6">
        
        {/* Appearance Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Appearance</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Application Theme</h3>
                <p className="text-sm text-gray-500">Select your preferred interface color scheme.</p>
              </div>
              <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
                <button className="flex items-center gap-2 px-4 py-2 rounded-md bg-white shadow-sm text-sm font-medium text-blue-600 border border-gray-200">
                  <Sun size={16} /> Light
                </button>
                <button className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                  <Moon size={16} /> Dark
                </button>
                <button className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                  <Monitor size={16} /> System
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Connection Defaults Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Connection Defaults</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Global Timeout (ms)</label>
                <input type="number" defaultValue={5000} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
                <p className="text-xs text-gray-500 mt-1">Default timeout for Request/Reply operations.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max History Lines</label>
                <input type="number" defaultValue={1000} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
                <p className="text-xs text-gray-500 mt-1">Maximum messages to keep in memory per subscriber.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Data Management Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Data Management</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between py-2">
              <div className="flex gap-3 items-center">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Database size={20} />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Backup & Restore</h3>
                  <p className="text-sm text-gray-500">Export your connections and layouts to a JSON file.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  <Download size={16} /> Export
                </button>
                <button onClick={handleImport} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  <Upload size={16} /> Import
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
