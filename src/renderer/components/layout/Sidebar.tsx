import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Server, Activity, Container, Settings, Info, Plus, Zap } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';

export default function Sidebar() {
  const navigate = useNavigate();
  const { sidebarCollapsed } = useUIStore();

  const navItems = [
    { to: '/', icon: <Server size={18} />, label: 'Connections' },
    { to: '/loadtest', icon: <Activity size={18} />, label: 'Load Testing' },
    { to: '/server', icon: <Container size={18} />, label: 'Docker' },
    { to: '/settings', icon: <Settings size={18} />, label: 'Settings' },
    { to: '/about', icon: <Info size={18} />, label: 'About' },
  ];

  if (sidebarCollapsed) {
    // Return collapsed sidebar if needed, but the prompt says w-64 is standard.
    // For now, let's keep it responsive if collapsed, but focus on the expanded state.
  }

  return (
    <div className="flex flex-col w-64 bg-slate-950 text-slate-300 h-screen flex-shrink-0 border-r border-slate-900 shadow-xl relative z-20">
      
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-800/50">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white shrink-0 shadow-sm">
          <Zap size={18} fill="currentColor" />
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-bold text-white tracking-tight leading-none">NATSBox</span>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">NATS Toolkit</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600/10 text-blue-500'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer / New Connection Action */}
      <div className="p-4 border-t border-slate-800/50">
        <button
          onClick={() => navigate('/connection/new')}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-sm font-medium transition-colors shadow-sm"
        >
          <Plus size={18} strokeWidth={2.5} />
          <span>New Connection</span>
        </button>
      </div>

    </div>
  );
}
