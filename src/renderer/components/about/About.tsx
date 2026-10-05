import React from 'react';
import { Github, ExternalLink, Info } from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-50 text-gray-800 p-8">
      <div className="bg-white p-10 rounded-xl shadow-md max-w-2xl w-full text-center border border-gray-100">
        
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
            <span className="text-white font-bold text-4xl">N</span>
          </div>
        </div>
        
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">NATSBox</h1>
        <div className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold mb-6">
          Version 1.0.0
        </div>

        <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
          A comprehensive developer tool to create, test, debug and monitor NATS messaging connectivity.
        </p>

        <div className="text-sm text-gray-500 mb-8 italic flex items-center justify-center">
          <Info size={14} className="mr-1" />
          Inspired by MQTTBox
        </div>

        <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mb-10">
          <a href="https://docs.nats.io" target="_blank" rel="noreferrer" className="flex items-center justify-center px-4 py-3 bg-gray-50 border hover:bg-gray-100 rounded-lg transition-colors text-gray-700 font-medium">
            <ExternalLink size={18} className="mr-2 text-blue-600" />
            NATS Docs
          </a>
          <a href="https://github.com/nats-io" target="_blank" rel="noreferrer" className="flex items-center justify-center px-4 py-3 bg-gray-50 border hover:bg-gray-100 rounded-lg transition-colors text-gray-700 font-medium">
            <Github size={18} className="mr-2" />
            GitHub
          </a>
        </div>

        <div className="border-t pt-6 text-xs text-gray-400 font-mono">
          <div className="flex justify-center space-x-6">
            <div>Electron: 28.0.0</div>
            <div>Node: 18.x</div>
            <div>React: 18.3.0</div>
          </div>
        </div>

      </div>
    </div>
  );
};
