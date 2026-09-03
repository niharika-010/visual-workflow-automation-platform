import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { fetchHealthStatus, apiClient } from '../services/api';
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

  const loadData = async () => {
    setIsLoading(true);
    try {
      const hData = await fetchHealthStatus();
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
  };

  useEffect(() => {
    loadData();
  }, []);

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
                <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                  <SettingsIcon className="w-5 h-5" />
                </div>
                <h1 className="text-2xl font-black tracking-tight text-white">System & Credential Settings</h1>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Manage secure integration credentials and monitor backend architecture health.
              </p>
            </div>

            {/* Tab Switches */}
            <div className="flex items-center space-x-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab('credentials')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'credentials'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Credentials Store
              </button>
              <button
                onClick={() => setActiveTab('health')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'health'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                System Health
              </button>
            </div>
          </div>

          {/* Tab 1: Credential Store */}
          {activeTab === 'credentials' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Key className="w-4 h-4 text-indigo-400" /> Secure Credential Manager
                  </h2>
                  <p className="text-xs text-slate-400">
                    Store secrets safely. Nodes reference credentials by ID instead of raw passwords.
                  </p>
                </div>

                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
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
                          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            <Shield className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-xs font-bold text-white">{cred.name}</h3>
                            <span className="text-[10px] font-mono text-indigo-300 uppercase font-bold">
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
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-indigo-400" /> Platform Infrastructure Architecture
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* Express API */}
                <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">Express REST API</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-lg font-black text-white">Online</div>
                  <p className="text-[10px] text-slate-500">Uptime: {Math.floor(health?.services?.api?.uptime || 0)}s</p>
                </div>

                {/* PostgreSQL */}
                <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">PostgreSQL Database</span>
                    {health?.services?.database?.status === 'healthy' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-400" />
                    )}
                  </div>
                  <div className="text-lg font-black text-white">
                    {health?.services?.database?.status === 'healthy' ? 'Connected' : 'Fallback Active'}
                  </div>
                  <p className="text-[10px] text-slate-500">Port 5432</p>
                </div>

                {/* Redis & BullMQ */}
                <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">Redis & BullMQ Queue</span>
                    {health?.services?.redis?.status === 'healthy' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-400" />
                    )}
                  </div>
                  <div className="text-lg font-black text-white">
                    {health?.services?.redis?.status === 'healthy' ? 'Connected' : 'Sync Fallback'}
                  </div>
                  <p className="text-[10px] text-slate-500">Port 6379</p>
                </div>

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
                <Shield className="w-4 h-4 text-indigo-400" /> Create Integration Credential
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
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-indigo-300"
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
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold"
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
