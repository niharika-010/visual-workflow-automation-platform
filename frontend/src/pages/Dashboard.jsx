import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { WorkflowCard } from '../components/WorkflowCard';
import { EmptyWorkflows } from '../components/EmptyWorkflows';
import { CreateWorkflowModal } from '../components/CreateWorkflowModal';
import { ServicesStatusCard } from '../components/ServicesStatusCard';
import { useWorkflowManagementStore } from '../store/useWorkflowManagementStore';
import {
  Plus,
  Search,
  Workflow,
  Zap,
  Activity,
  CheckCircle2,
  Clock,
  Loader2,
} from 'lucide-react';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { workflows = [], isLoading, loadWorkflows } = useWorkflowManagementStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadWorkflows();
  }, [loadWorkflows]);

  const safeWorkflows = Array.isArray(workflows) ? workflows : [];

  const filteredWorkflows = safeWorkflows.filter((wf) => {
    if (!wf) return false;
    const matchesFilter =
      activeFilter === 'All'
        ? true
        : activeFilter === 'Active'
        ? wf.status === 'active'
        : activeFilter === 'Draft'
        ? wf.status === 'draft'
        : wf.status === 'inactive';

    const matchesSearch =
      (wf.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (wf.description || '').toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const activeCount = safeWorkflows.filter((w) => w && w.status === 'active').length;
  const draftCount = safeWorkflows.filter((w) => w && w.status === 'draft').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header />

      <div className="flex flex-1">
        <Sidebar activeTab="workflows" />

        <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  <Workflow className="w-5 h-5" />
                </div>
                <h1 className="text-2xl font-black tracking-tight text-white">Workflows Workspace</h1>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Design, trigger, and automate backend workflows with visual DAG graphs.
              </p>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-lg shadow-teal-600/20 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Create Workflow</span>
            </button>
          </div>

          {/* Metrics Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1 backdrop-blur-md">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Workflows</span>
              <div className="text-2xl font-black text-white">{safeWorkflows.length}</div>
              <p className="text-[10px] text-slate-500">Multi-tenant workspace</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1 backdrop-blur-md">
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400">Active Workflows</span>
              <div className="text-2xl font-black text-teal-400">{activeCount}</div>
              <p className="text-[10px] text-slate-500">Scheduled & webhook enabled</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1 backdrop-blur-md">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Draft Workflows</span>
              <div className="text-2xl font-black text-amber-400">{draftCount}</div>
              <p className="text-[10px] text-slate-500">Work in progress</p>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
            <div className="relative max-w-md w-full">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search workflows by name or description..."
                className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-all"
              />
            </div>

            <div className="flex items-center space-x-1.5">
              {['All', 'Active', 'Draft', 'Inactive'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeFilter === filter
                      ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30 shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Workflows Grid */}
          {isLoading ? (
            <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center space-y-3 bg-slate-900/40 rounded-2xl border border-slate-800">
              <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
              <p className="text-xs font-medium">Loading workflows workspace...</p>
            </div>
          ) : filteredWorkflows.length === 0 ? (
            <EmptyWorkflows onCreateClick={() => setIsModalOpen(true)} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredWorkflows.map((wf) => (
                <WorkflowCard key={wf.id} workflow={wf} />
              ))}
            </div>
          )}

          {/* System Infrastructure Status */}
          <ServicesStatusCard />

        </main>
      </div>

      {/* Create Workflow Modal */}
      {isModalOpen && (
        <CreateWorkflowModal onClose={() => setIsModalOpen(false)} />
      )}
    </div>
  );
};

export default Dashboard;
