import React from 'react';
import { Workflow, Layers, Server, ShieldCheck, LogOut, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export const Header = ({ status }) => {
  const { user, logout } = useAuthStore();
  const isHealthy = status === 'ok';

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Platform Name */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Workflow className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  WorkflowAutomator
                </span>
                <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  Phase 2
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Visual Workflow Automation Engine</p>
            </div>
          </div>

          {/* Center Navigation Badges */}
          <div className="hidden md:flex items-center space-x-6 text-sm font-medium text-slate-300">
            <div className="flex items-center space-x-2 text-indigo-400">
              <Layers className="w-4 h-4" />
              <span>Canvas Architecture</span>
            </div>
            <div className="flex items-center space-x-2 hover:text-white transition-colors cursor-pointer">
              <Server className="w-4 h-4 text-slate-400" />
              <span>BullMQ Queue</span>
            </div>
            <div className="flex items-center space-x-2 hover:text-white transition-colors cursor-pointer">
              <ShieldCheck className="w-4 h-4 text-slate-400" />
              <span>Auth REST Services</span>
            </div>
          </div>

          {/* User Profile & Health Status */}
          <div className="flex items-center space-x-4">
            
            {/* Health Status Indicator */}
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80">
              <div className={`w-2 h-2 rounded-full animate-pulse ${isHealthy ? 'bg-emerald-400 shadow-lg shadow-emerald-500/50' : 'bg-amber-400'}`} />
              <span className="text-xs font-semibold text-slate-200">
                {isHealthy ? 'API Active' : 'Connecting...'}
              </span>
            </div>

            {/* Authenticated User Badge & Logout */}
            {user && (
              <div className="flex items-center space-x-3 border-l border-slate-800 pl-4">
                <div className="flex items-center space-x-2 bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-700/60">
                  <div className="w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 flex items-center justify-center text-xs font-bold">
                    {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-3.5 h-3.5" />}
                  </div>
                  <span className="text-xs font-medium text-slate-200 hidden sm:inline max-w-[120px] truncate">
                    {user.name}
                  </span>
                </div>

                <button
                  onClick={logout}
                  title="Sign out"
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
