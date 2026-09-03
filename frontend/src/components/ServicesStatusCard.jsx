import React from 'react';
import { Database, HardDrive, Cpu, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export const ServicesStatusCard = ({ healthData, isLoading, onRefresh }) => {
  const dbConnected = healthData?.services?.database?.connected;
  const redisConnected = healthData?.services?.redis?.connected;
  const apiStatus = healthData?.status === 'ok';

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-2xl">
      <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-400" />
            Infrastructure Readiness Dashboard
          </h2>
          <p className="text-sm text-slate-400 mt-1">Phase 1 core service connection telemetry</p>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* REST API Status */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">REST API</span>
            {apiStatus ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400" />
            )}
          </div>
          <div className="space-y-1">
            <div className="text-sm font-semibold text-slate-200">
              {healthData?.message || 'Connecting to backend...'}
            </div>
            <div className="text-xs text-slate-500 font-mono">
              Endpoint: /api/health
            </div>
          </div>
        </div>

        {/* PostgreSQL Status */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">PostgreSQL</span>
            </div>
            {dbConnected ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Connected
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Standby / Docker
              </span>
            )}
          </div>
          <div className="text-xs text-slate-400">
            {dbConnected ? (
              <span>Tables initialized. Workflows DB ready.</span>
            ) : (
              <span className="text-slate-500">Run <code className="text-indigo-300">docker-compose up -d</code> to attach</span>
            )}
          </div>
        </div>

        {/* Redis & BullMQ Status */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <HardDrive className="w-4 h-4 text-rose-400" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Redis & BullMQ</span>
            </div>
            {redisConnected ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Connected
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Standby / Docker
              </span>
            )}
          </div>
          <div className="text-xs text-slate-400">
            {redisConnected ? (
              <span>BullMQ Queue engine initialized</span>
            ) : (
              <span className="text-slate-500">Worker & Redis ready for orchestration</span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
