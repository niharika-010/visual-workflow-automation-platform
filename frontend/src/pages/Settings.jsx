import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { ServicesStatusCard } from '../components/ServicesStatusCard';
import { fetchHealthStatus, apiClient, testWorkerQueueApi } from '../services/api';
import {
  Settings as SettingsIcon,
  Shield,
  Key,
  Database,
  Server,
  HardDrive,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Layers,
  Send,
  Zap,
  HelpCircle,
} from 'lucide-react';

export const Settings = () => {
  const [health, setHealth] = useState(null);
  const [credentials, setCredentials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('credentials');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Credential Form State
  const [credName, setCredName] = useState('');
  const [credType, setCredType] = useState('slack_webhook');
  const [credJson, setCredJson] = useState('{\n  "webhookUrl": "https://hooks.slack.com/services/..."\n}');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Queue Test State
  const [isTestingQueue, setIsTestingQueue] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const hData = await fetchHealthStatus(true);
      setHealth(hData);

      const cData = await apiClient.get('/credentials');
      if (cData.data?.status === 'success') {
        setCredentials(cData.data.credentials || []);
      }
    } catch (err) {
      console.error('Error loading settings data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTestWorker = async () => {
    setIsTestingQueue(true);
    setTestResult(null);
    try {
      const res = await testWorkerQueueApi();
      setTestResult(res);
      loadData();
    } catch (err) {
      setTestResult({
        status: 'error',
        message: err.message || 'Failed to dispatch worker job',
      });
    } finally {
      setIsTestingQueue(false);
    }
  };

  const handleCreateCredential = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let parsedData = {};
      try {
        parsedData = JSON.parse(credJson);
      } catch (err) {
        alert('Invalid JSON data format');
        setIsSubmitting(false);
        return;
      }

      const res = await apiClient.post('/credentials', {
        name: credName,
        type: credType,
        data: parsedData,
      });

      if (res.data?.status === 'success') {
        setIsModalOpen(false);
        setCredName('');
        loadData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create credential');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCredential = async (id) => {
    if (!confirm('Are you sure you want to delete this credential?')) return;
    try {
      await apiClient.delete(`/credentials/${id}`);
      loadData();
    } catch (err) {
      alert('Failed to delete credential');
    }
  };

  const queueStats = health?.services?.queue || {
    name: 'workflow-execution-queue',
    waiting: 0,
    active: 0,
    completed: 0,
    failed: 0,
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header />

      <div className="flex flex-1">
        <Sidebar activeTab="settings" />

        <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  <SettingsIcon className="w-5 h-5" />
                </div>
                <h1 className="text-2xl font-black tracking-tight text-white">System & Credential Settings</h1>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Manage secure integration credentials, infrastructure telemetry, and BullMQ worker queue monitoring.
              </p>
            </div>

            {/* Tab Switches */}
            <div className="flex items-center space-x-1.5 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab('credentials')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'credentials'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Credentials Store
              </button>
              <button
                onClick={() => setActiveTab('health')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'health'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                System Health
              </button>
              <button
                onClick={() => setActiveTab('queue')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'queue'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                BullMQ Queue
              </button>
            </div>
          </div>

          {/* Tab 1: Credential Store */}
          {activeTab === 'credentials' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Key className="w-4 h-4 text-teal-400" /> Secure Credential Manager
                  </h2>
                  <p className="text-xs text-slate-400">
                    Store secrets safely. Nodes reference credentials by ID instead of raw passwords.
                  </p>
                </div>

                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Credential</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {credentials.length === 0 ? (
                  <div className="col-span-full p-12 text-center text-slate-500 bg-slate-900/40 border border-slate-800 rounded-2xl text-xs">
                    No secure credentials stored yet. Click "Add Credential" to create one.
                  </div>
                ) : (
                  credentials.map((cred) => (
                    <div
                      key={cred.id}
                      className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all space-y-3 relative group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2.5">
                          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                            <Shield className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-xs font-bold text-white">{cred.name}</h3>
                            <span className="text-[10px] font-mono text-teal-300 uppercase font-bold">
                              {cred.type}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteCredential(cred.id)}
                          className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 transition-colors"
                          title="Delete Credential"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 font-mono">
                        ID: {cred.id}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Tab 2: System Health */}
          {activeTab === 'health' && (
            <div className="space-y-4">
              <ServicesStatusCard
                healthData={health}
                isLoading={isLoading}
                onRefresh={loadData}
              />
            </div>
          )}

          {/* Tab 3: BullMQ Queue Monitor */}
          {activeTab === 'queue' && (
            <div className="space-y-6">
              
              {/* Educational Overview Box */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex items-center space-x-2 text-teal-400 font-bold text-sm">
                  <Zap className="w-5 h-5" />
                  <span>BullMQ Background Queue Architecture & Use Case</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong className="text-white">Why BullMQ?</strong> When a workflow is triggered (via HTTP Webhook, Manual Run, or Cron Schedule), executing graph nodes (HTTP calls, Emails, Slack messages, SQL queries) synchronously would slow down the API response.
                </p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  With <strong className="text-teal-300">BullMQ + Redis</strong>, the backend API immediately enqueues the job into Redis (<code className="text-teal-300 font-mono">workflow-execution-queue</code>) and responds to the user in milliseconds. Our separate <strong className="text-white">Worker Execution Daemon</strong> (<code className="text-slate-400 font-mono">worker/src/index.js</code>) processes jobs asynchronously, handles automatic retries (`attempts: 3`), and records step execution logs into PostgreSQL.
                </p>
              </div>

              {/* Queue Controls & Test Dispatch */}
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-teal-400" /> BullMQ Queue Inspector & Worker Probe
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Queue: <code className="text-teal-300 font-mono font-bold">{queueStats.name}</code> • Redis Port 6379
                    </p>
                  </div>

                  <button
                    onClick={handleTestWorker}
                    disabled={isTestingQueue}
                    className="flex items-center justify-center space-x-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-lg shadow-teal-600/20 cursor-pointer disabled:opacity-50"
                  >
                    {isTestingQueue ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>⚡ Dispatch Test Job to Worker Queue</span>
                  </button>
                </div>

                {/* Queue Job Counts Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Waiting Jobs</span>
                    <div className="text-2xl font-black text-amber-400">{queueStats.waiting}</div>
                    <p className="text-[10px] text-slate-500">Queued in Redis</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Active Jobs</span>
                    <div className="text-2xl font-black text-sky-400">{queueStats.active}</div>
                    <p className="text-[10px] text-slate-500">Processing by worker</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Completed Jobs</span>
                    <div className="text-2xl font-black text-emerald-400">{queueStats.completed}</div>
                    <p className="text-[10px] text-slate-500">Successfully executed</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Failed Jobs</span>
                    <div className="text-2xl font-black text-rose-400">{queueStats.failed}</div>
                    <p className="text-[10px] text-slate-500">Retries exhausted</p>
                  </div>
                </div>

                {/* Test Result Feedback Box */}
                {testResult && (
                  <div
                    className={`p-4 rounded-xl border text-xs font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
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
                      <span className="text-[11px] text-teal-400 font-bold bg-slate-900 px-3 py-1 rounded-lg border border-slate-800 shrink-0">
                        Enqueued Job ID: {testResult.result.jobId}
                      </span>
                    )}
                  </div>
                )}

              </div>
            </div>
          )}

        </main>
      </div>

      {/* Add Credential Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-teal-400" /> Create Integration Credential
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCredential} className="space-y-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-300 uppercase">Credential Name</label>
                <input
                  type="text"
                  required
                  value={credName}
                  onChange={(e) => setCredName(e.target.value)}
                  placeholder="e.g. Production Slack Alert Webhook"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-300 uppercase">Type</label>
                <select
                  value={credType}
                  onChange={(e) => setCredType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                >
                  <option value="slack_webhook">Slack Webhook</option>
                  <option value="smtp_email">SMTP Email Credentials</option>
                  <option value="postgres_db">PostgreSQL DB Connection</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-300 uppercase">Data (JSON Format)</label>
                <textarea
                  rows={4}
                  required
                  value={credJson}
                  onChange={(e) => setCredJson(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-teal-300"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-xl bg-teal-600 text-white text-xs font-bold"
                >
                  {isSubmitting ? 'Saving...' : 'Save Credential'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
