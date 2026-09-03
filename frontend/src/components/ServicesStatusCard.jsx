import React, { useState } from 'react';
import {
  Database,
  HardDrive,
  Cpu,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Zap,
  Clock,
  Layers,
  Activity,
  Send,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { testWorkerQueueApi } from '../services/api';

export const ServicesStatusCard = ({ healthData, isLoading, onRefresh }) => {
  const [isTestingQueue, setIsTestingQueue] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [showExplainer, setShowExplainer] = useState(false);

  const dbConnected = healthData?.services?.database?.connected;
  const redisConnected = healthData?.services?.redis?.connected;
  const apiStatus = healthData?.status === 'ok';

  const queueStats = healthData?.services?.queue || {
    name: 'workflow-execution-queue',
    waiting: 0,
    active: 0,
    completed: 0,
    failed: 0,
  };

  const systemMetrics = healthData?.system || {};

  const handleTestWorker = async () => {
    setIsTestingQueue(true);
    setTestResult(null);
    try {
      const res = await testWorkerQueueApi();
      setTestResult(res);
      if (onRefresh) onRefresh();
    } catch (err) {
      setTestResult({
        status: 'error',
        message: err.message || 'Failed to dispatch worker job',
      });
    } finally {
      setIsTestingQueue(false);
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-2xl space-y-6">
      
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Cpu className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black tracking-tight text-white">
              Infrastructure Readiness & Queue Telemetry
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time backend API, PostgreSQL, Redis, and BullMQ worker queue monitoring.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowExplainer(!showExplainer)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-teal-400" />
            <span>What is BullMQ?</span>
            {showExplainer ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/30 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Re-check Telemetry</span>
          </button>
        </div>
      </div>

      {/* BullMQ Educational Explainer Banner */}
      {showExplainer && (
        <div className="p-4 rounded-xl bg-slate-950/90 border border-teal-500/30 space-y-2.5 text-xs text-slate-300">
          <div className="flex items-center space-x-2 text-teal-400 font-bold">
            <Zap className="w-4 h-4" />
            <span>What is the BullMQ Queue and Why Do We Use It?</span>
          </div>
          <p className="leading-relaxed">
            <strong className="text-white">BullMQ</strong> is our high-performance background queue powered by <strong className="text-teal-300">Redis</strong>.
            When a user triggers a workflow (via manual button, HTTP webhook, or cron schedule), the Express API backend does <em className="text-amber-300 font-semibold">not</em> block the browser.
            Instead, it pushes an execution payload job into the BullMQ queue (<code className="text-teal-300 font-mono">workflow-execution-queue</code>).
          </p>
          <p className="leading-relaxed">
            Our background <strong className="text-white">Worker Process Daemon</strong> (<code className="text-slate-400 font-mono">worker/src/index.js</code>) picks up jobs concurrently from Redis, executes each DAG graph node (HTTP, Email, Slack, SQL), handles automatic retries, and saves step execution logs without freezing your UI!
          </p>
        </div>
      )}

      {/* Main 3 Infrastructure Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Express REST API */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-teal-400" />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Express REST API</span>
            </div>
            {apiStatus ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Online
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Offline
              </span>
            )}
          </div>

          <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-200">
              {healthData?.message || 'Express API active on port 5000'}
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-800/60">
              <span>Latency: <strong className="text-teal-400">{systemMetrics.apiLatencyMs || 2}ms</strong></span>
              <span>Uptime: <strong className="text-slate-300">{healthData?.uptimeSeconds || 0}s</strong></span>
            </div>
          </div>
        </div>

        {/* PostgreSQL Database */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">PostgreSQL DB</span>
            </div>
            {dbConnected ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Connected
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                Fallback Repository
              </span>
            )}
          </div>

          <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-200">
              {dbConnected ? 'Schema initialized (JSONB & UUID)' : 'Port 5432 (Docker Container)'}
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-800/60">
              <span>Query Latency: <strong className="text-sky-400">{healthData?.services?.database?.latencyMs || 4}ms</strong></span>
              <span>Port: <strong className="text-slate-300">5432</strong></span>
            </div>
          </div>
        </div>

        {/* Redis & BullMQ Queue */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <HardDrive className="w-4 h-4 text-rose-400" />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Redis & BullMQ</span>
            </div>
            {redisConnected ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Active Queue
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                Sync Execution Mode
              </span>
            )}
          </div>

          <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-200 truncate">
              Queue: <code className="text-teal-300 font-mono">{queueStats.name}</code>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-800/60">
              <span>Redis Latency: <strong className="text-rose-400">{healthData?.services?.redis?.latencyMs || 1}ms</strong></span>
              <span>Port: <strong className="text-slate-300">6379</strong></span>
            </div>
          </div>
        </div>

      </div>

      {/* Interactive BullMQ Queue Telemetry & Test Dispatch */}
      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-teal-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              BullMQ Queue Live Job Counts & Interactive Dispatch
            </h3>
          </div>

          <button
            onClick={handleTestWorker}
            disabled={isTestingQueue}
            className="flex items-center justify-center space-x-2 px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-md shadow-teal-600/20 cursor-pointer disabled:opacity-50"
          >
            {isTestingQueue ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>⚡ Test BullMQ Queue Dispatch</span>
          </button>
        </div>

        {/* Live Job Statistics Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800/80 text-center space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Waiting Jobs</span>
            <div className="text-lg font-black text-amber-400">{queueStats.waiting}</div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800/80 text-center space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Active Jobs</span>
            <div className="text-lg font-black text-sky-400">{queueStats.active}</div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800/80 text-center space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Completed Jobs</span>
            <div className="text-lg font-black text-emerald-400">{queueStats.completed}</div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800/80 text-center space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Failed Jobs</span>
            <div className="text-lg font-black text-rose-400">{queueStats.failed}</div>
          </div>
        </div>

        {/* Test Result Feedback Alert */}
        {testResult && (
          <div
            className={`p-3 rounded-xl border text-xs font-mono flex items-center justify-between ${
              testResult.status === 'success' || testResult.result?.queued
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{testResult.message}</span>
            </div>
            {testResult.result?.jobId && (
              <span className="text-[10px] text-teal-400 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                Job ID: {testResult.result.jobId}
              </span>
            )}
          </div>
        )}
      </div>

    </div>
  );
};
