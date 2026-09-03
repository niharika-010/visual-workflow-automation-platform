import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { fetchWorkflowsApi, apiClient } from '../services/api';
import {
  Activity,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  ArrowRight,
  RefreshCw,
  Zap,
} from 'lucide-react';

const STATUS_PILLS = ['All', 'completed', 'running', 'queued', 'failed'];

export const Executions = () => {
  const navigate = useNavigate();
  const [executions, setExecutions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatus, setActiveStatus] = useState('All');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadAllExecutions = async () => {
    setIsRefreshing(true);
    try {
      const wfData = await fetchWorkflowsApi();
      if (wfData.status === 'success' && wfData.workflows) {
        const allExecs = [];

        for (const wf of wfData.workflows) {
          try {
            const res = await apiClient.get(`/workflows/${wf.id}/executions`);
            if (res.data?.status === 'success' && res.data.executions) {
              const mapped = res.data.executions.map((e) => ({
                ...e,
                workflowName: wf.name,
              }));
              allExecs.push(...mapped);
            }
          } catch (e) {
            // Ignore single workflow fetch errors
          }
        }

        allExecs.sort((a, b) => new Date(b.started_at) - new Date(a.started_at));
        setExecutions(allExecs);
      }
    } catch (err) {
      console.error('Failed to load executions:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllExecutions();
    // Auto refresh every 5 seconds
    const interval = setInterval(() => {
      loadAllExecutions();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredExecutions = executions.filter((exec) => {
    const matchesStatus =
      activeStatus === 'All' ? true : exec.status === activeStatus;
    const matchesSearch =
      (exec.workflowName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exec.id || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getDuration = (start, finish) => {
    if (!start || !finish) return 'In progress...';
    const ms = new Date(finish) - new Date(start);
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header />

      <div className="flex flex-1">
        <Sidebar activeTab="executions" />

        <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                  <Activity className="w-5 h-5" />
                </div>
                <h1 className="text-2xl font-black tracking-tight text-white">Execution Runs</h1>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Monitor real-time workflow executions, step logs, and duration metrics.
              </p>
            </div>

            <button
              onClick={loadAllExecutions}
              disabled={isRefreshing}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Search & Status Filters */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
            
            {/* Search Input */}
            <div className="relative max-w-md w-full">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by workflow name or execution ID..."
                className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>

            {/* Status Filter Pills */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 custom-scrollbar">
              {STATUS_PILLS.map((st) => (
                <button
                  key={st}
                  onClick={() => setActiveStatus(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                    activeStatus === st
                      ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Executions Table */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl backdrop-blur-md">
            {isLoading ? (
              <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                <p className="text-xs font-medium">Loading execution logs...</p>
              </div>
            ) : filteredExecutions.length === 0 ? (
              <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center space-y-3">
                <Zap className="w-10 h-10 text-slate-600" />
                <p className="text-sm font-semibold text-slate-300">No execution runs found</p>
                <p className="text-xs text-slate-500 max-w-sm">
                  Run a workflow manually or trigger a webhook to view execution history.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Workflow</th>
                      <th className="py-3.5 px-4">Execution ID</th>
                      <th className="py-3.5 px-4">Started At</th>
                      <th className="py-3.5 px-4">Duration</th>
                      <th className="py-3.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    {filteredExecutions.map((exec) => {
                      const isCompleted = exec.status === 'completed';
                      const isFailed = exec.status === 'failed';
                      const isRunning = exec.status === 'running';

                      return (
                        <tr
                          key={exec.id}
                          onClick={() => navigate(`/executions/${exec.id}`)}
                          className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                        >
                          {/* Status Badge */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {isCompleted && (
                              <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Success</span>
                              </span>
                            )}
                            {isFailed && (
                              <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>Failed</span>
                              </span>
                            )}
                            {isRunning && (
                              <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Running</span>
                              </span>
                            )}
                            {exec.status === 'queued' && (
                              <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                <Clock className="w-3.5 h-3.5" />
                                <span>Queued</span>
                              </span>
                            )}
                          </td>

                          {/* Workflow Name */}
                          <td className="py-3.5 px-4 font-bold text-white group-hover:text-indigo-300 transition-colors">
                            {exec.workflowName || 'Workflow'}
                          </td>

                          {/* Execution ID */}
                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                            {exec.id}
                          </td>

                          {/* Started At */}
                          <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                            {new Date(exec.started_at).toLocaleString()}
                          </td>

                          {/* Duration */}
                          <td className="py-3.5 px-4 font-mono text-slate-300">
                            {getDuration(exec.started_at, exec.finished_at)}
                          </td>

                          {/* Action Arrow */}
                          <td className="py-3.5 px-4 text-right">
                            <button className="p-1 rounded-lg text-slate-500 group-hover:text-indigo-400 transition-colors">
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </main>
      </div>
    </div>
  );
};
