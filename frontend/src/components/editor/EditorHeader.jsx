import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkflowEditorStore } from '../../store/useWorkflowEditorStore';
import { VersionHistoryDrawer } from './VersionHistoryDrawer';
import { validateWorkflowGraph } from '../../utils/workflowValidator';
import {
  ArrowLeft,
  Workflow,
  Save,
  Power,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  History,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

export const EditorHeader = () => {
  const navigate = useNavigate();
  const {
    workflow,
    nodes,
    edges,
    isDirty,
    isSaving,
    saveWorkflow,
    toggleStatus,
    setVersionsOpen,
    isAutosaveEnabled,
    setAutosaveEnabled,
  } = useWorkflowEditorStore();

  const [notification, setNotification] = useState(null);

  if (!workflow) return null;

  const isEverActive = workflow.status === 'active';

  const handleSave = async () => {
    const validation = validateWorkflowGraph(nodes, edges);
    if (!validation.isValid) {
      const firstErr = validation.errors[0];
      showToast(`⚠️ Validation Notice: ${firstErr.message}`, 'warning');
    }

    const result = await saveWorkflow();
    if (result.success) {
      showToast('Workflow saved & version snapshot created!');
    } else {
      showToast('Failed to save workflow', 'error');
    }
  };

  const handleToggleStatus = async () => {
    if (workflow.status !== 'active') {
      const validation = validateWorkflowGraph(nodes, edges);
      if (!validation.isValid) {
        const firstErr = validation.errors[0];
        showToast(`❌ Cannot Activate: ${firstErr.message}`, 'error');
        return;
      }
    }
    await toggleStatus();
    showToast(`Workflow status set to ${workflow.status === 'active' ? 'inactive' : 'active'}`);
  };

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <>
      <header className="h-16 bg-slate-900/90 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between backdrop-blur-md sticky top-0 z-30 shadow-xl">
        
        {/* Left: Back button & Workflow Title */}
        <div className="flex items-center space-x-4 min-w-0">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer shrink-0"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center space-x-3 min-w-0">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 text-white shadow-md shrink-0">
              <Workflow className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-bold text-white truncate max-w-xs sm:max-w-md">
                  {workflow.name}
                </h1>

                {/* Status Badges */}
                {isSaving ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1 shrink-0">
                    <Loader2 className="w-3 h-3 animate-spin text-indigo-400" /> Saving...
                  </span>
                ) : isDirty ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" /> Unsaved changes
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Saved (v{workflow.version})
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {workflow.description || 'Visual workflow canvas graph'}
              </p>
            </div>
          </div>
        </div>

        {/* Toast Banner Notification */}
        {notification && (
          <div className={`hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold border animate-in fade-in slide-in-from-top duration-200 ${
            notification.type === 'error'
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              : notification.type === 'warning'
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
          }`}>
            <Sparkles className="w-3.5 h-3.5" />
            <span>{notification.message}</span>
          </div>
        )}

        {/* Right: Controls */}
        <div className="flex items-center space-x-3 shrink-0">
          
          {/* Autosave Toggle */}
          <button
            onClick={() => setAutosaveEnabled(!isAutosaveEnabled)}
            className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
              isAutosaveEnabled
                ? 'bg-slate-800 text-indigo-300 border-slate-700'
                : 'bg-slate-950 text-slate-500 border-slate-800'
            }`}
            title="Toggle debounced autosave"
          >
            {isAutosaveEnabled ? (
              <ToggleRight className="w-4 h-4 text-indigo-400" />
            ) : (
              <ToggleLeft className="w-4 h-4 text-slate-500" />
            )}
            <span>Autosave</span>
          </button>

          {/* Version History Button */}
          <button
            onClick={() => setVersionsOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all cursor-pointer"
          >
            <History className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Versions</span>
          </button>

          {/* Toggle Status Button */}
          <button
            onClick={handleToggleStatus}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              isEverActive
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isEverActive ? 'Active' : 'Inactive'}</span>
          </button>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-lg shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save</span>
              </>
            )}
          </button>

        </div>

      </header>

      {/* Version History Drawer */}
      <VersionHistoryDrawer />
    </>
  );
};
