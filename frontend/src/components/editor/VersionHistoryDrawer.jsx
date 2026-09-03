import React, { useState } from 'react';
import { useWorkflowEditorStore } from '../../store/useWorkflowEditorStore';
import { History, X, RotateCcw, Clock, Layers, Loader2, Sparkles } from 'lucide-react';

export const VersionHistoryDrawer = () => {
  const {
    versions,
    isVersionsOpen,
    setVersionsOpen,
    restoreVersion,
    workflow,
    isSaving,
  } = useWorkflowEditorStore();

  const [restoringId, setRestoringId] = useState(null);

  if (!isVersionsOpen) return null;

  const handleRestore = async (versionId) => {
    setRestoringId(versionId);
    await restoreVersion(versionId);
    setRestoringId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-xs">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col p-6 shadow-2xl animate-in slide-in-from-right duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Version History</h3>
              <p className="text-xs text-slate-400">Restore previous workflow snapshots</p>
            </div>
          </div>
          <button
            onClick={() => setVersionsOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Versions List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {versions.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No previous version snapshots saved yet.
            </div>
          ) : (
            versions.map((ver) => {
              const isCurrent = workflow?.version === ver.version;
              const json = typeof ver.workflow_json === 'string' ? JSON.parse(ver.workflow_json) : ver.workflow_json || {};
              const nodeCount = json.nodes?.length || 0;
              const formattedDate = new Date(ver.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });

              return (
                <div
                  key={ver.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'bg-indigo-950/40 border-indigo-500/50 shadow-md'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-extrabold ${
                        isCurrent
                          ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/40'
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        Version {ver.version}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Active State
                        </span>
                      )}
                    </div>

                    {!isCurrent && (
                      <button
                        onClick={() => handleRestore(ver.id)}
                        disabled={restoringId === ver.id || isSaving}
                        className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-indigo-600/30 hover:text-indigo-300 border border-slate-700 hover:border-indigo-500/40 text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1.5 disabled:opacity-50"
                      >
                        {restoringId === ver.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <RotateCcw className="w-3.5 h-3.5" />
                        )}
                        <span>Restore</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center space-x-4 text-xs text-slate-400 pt-1">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{formattedDate}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Layers className="w-3.5 h-3.5 text-slate-500" />
                      <span>{nodeCount} Nodes</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-500">
          💡 Restoring a version creates a new historical snapshot automatically.
        </div>

      </div>
    </div>
  );
};
