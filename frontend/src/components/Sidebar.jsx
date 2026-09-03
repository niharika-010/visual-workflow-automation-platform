import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Activity,
  Settings as SettingsIcon,
  Shield,
  BookOpen,
} from 'lucide-react';

export const Sidebar = ({ activeTab = 'workflows' }) => {
  const navigate = useNavigate();

  const navItems = [
    { id: 'workflows', label: 'Workflows', icon: LayoutDashboard, path: '/' },
    { id: 'executions', label: 'Execution Runs', icon: Activity, path: '/executions' },
    { id: 'settings', label: 'Settings', icon: SettingsIcon, path: '/settings' },
  ];

  return (
    <aside className="w-64 bg-slate-900/60 border-r border-slate-800 p-4 flex flex-col justify-between hidden md:flex shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 px-3">
          Platform Workspace
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
        <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs">
          <Shield className="w-4 h-4" />
          <span>BullMQ Worker Active</span>
        </div>
        <p className="text-[10px] text-slate-500 leading-normal">
          Non-blocking execution architecture backed by Redis queue & PostgreSQL.
        </p>
      </div>
    </aside>
  );
};
