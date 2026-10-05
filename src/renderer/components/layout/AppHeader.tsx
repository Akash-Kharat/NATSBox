import React from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Command } from 'lucide-react';

interface AppHeaderProps {
  title?: string;
}

export default function AppHeader({ title }: AppHeaderProps) {
  const location = useLocation();
  
  const getPageTitle = () => {
    if (location.pathname === '/') return 'Connections';
    if (location.pathname.startsWith('/connection/new')) return 'New Connection';
    if (location.pathname.startsWith('/connection/')) return 'Connection Details';
    if (location.pathname.startsWith('/loadtest')) return 'Load Testing';
    if (location.pathname.startsWith('/server')) return 'Docker Servers';
    if (location.pathname === '/about') return 'About NATSBox';
    if (location.pathname === '/settings') return 'Settings';
    return title || 'NATSBox';
  };

  return (
    <header className="h-14 bg-white border-b border-gray-200 px-4 flex items-center justify-between flex-shrink-0 z-10 shadow-sm">
      <div className="flex items-center">
        <h2 className="text-lg font-semibold text-gray-800">{getPageTitle()}</h2>
      </div>

      <div className="flex items-center flex-1 max-w-md mx-8">
        <div className="relative w-full group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={14} className="text-gray-400 group-hover:text-gray-500 transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-9 pr-12 py-1.5 border border-gray-300 rounded-md leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
            placeholder="Search NATSBox..."
          />
          <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
            <kbd className="inline-flex items-center px-2 py-0.5 rounded border border-gray-200 bg-white text-xs font-sans text-gray-400">
              <Command size={10} className="mr-0.5" /> K
            </kbd>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded border border-gray-200">
          v1.0.0
        </div>
      </div>
    </header>
  );
}
