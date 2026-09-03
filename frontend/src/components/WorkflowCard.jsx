import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkflowManagementStore } from '../store/useWorkflowManagementStore';
import {
  Workflow,
  Power,
  Trash2,
  ExternalLink,
  Layers,
  Clock,
  Loader2,
} from 'lucide-react';

export const WorkflowCard = ({ workflow }) => {
  const navigate = useNavigate();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const { removeWorkflow, toggleWorkflowStatus } = useWorkflowManagementStore();

  const isEverActive = workflow.status === 'active';
  const nodeCount = workflow.workflow_json?.nodes?.length || 0;
  const formattedDate = new Date(workflow.updated_at || workflow.created_at).toLocaleDateString(
    'en-US',
    { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }
  );

  const handleToggleStatus = async () => {
    setIsUpdating(true);
    await toggleWorkflowStatus(workflow.id, workflow.status);
    setIsUpdating(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    await removeWorkflow(workflow.id);
    setIsDeleting(false);
  };

  const handleOpenEditor = () => {
    navigate(`/workflow/${workflow.id}`);
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-6 transition-all shadow-xl hover:shadow-2xl hover:shadow-indigo-500/5 flex flex-col justify-between group">
      <div>
        
        {/* Top Bar: Icon, Name, and Status Badge */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center space-x-3 min-w-0">
            <div className={`p-2.5 rounded-xl border shrink-0 transition-colors ${
              isEverActive
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : workflow.status === 'inactive'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}>
              <Workflow className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3
                onClick={handleOpenEditor}
                className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors truncate cursor-pointer"
              >
                {workflow.name}
              </h3>
              <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">
                {workflow.description || 'No description provided'}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border shrink-0 ${
            isEverActive
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/20'
              : workflow.status === 'inactive'
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}>
            {workflow.status || 'draft'}
          </span>
        </div>

        {/* Metadata Footer */}
        <div className="flex items-center space-x-4 text-xs text-slate-500 mt-4 pt-3 border-t border-slate-800/80">
          <div className="flex items-center space-x-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>{nodeCount} {nodeCount === 1 ? 'Node' : 'Nodes'}</span>
          </div>
          <div className="flex items-center space-x-1.5 truncate">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">Updated {formattedDate}</span>
          </div>
        </div>

      </div>

      {/* Action Footer */}
      <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
        
        {/* Toggle Activate / Deactivate Button */}
        <button
          onClick={handleToggleStatus}
          disabled={isUpdating}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
            isEverActive
              ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
              : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
          }`}
        >
          {isUpdating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Power className="w-3.5 h-3.5" />
          )}
          <span>{isEverActive ? 'Deactivate' : 'Activate'}</span>
        </button>

        {/* Open & Delete Group */}
        <div className="flex items-center space-x-2">
          {showConfirmDelete ? (
            <div className="flex items-center space-x-1.5">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold cursor-pointer transition-all"
              >
                {isDeleting ? 'Deleting...' : 'Confirm'}
              </button>
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="px-2 py-1 rounded-lg bg-slate-800 text-slate-400 text-[11px] font-semibold cursor-pointer hover:bg-slate-700"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirmDelete(true)}
              title="Delete workflow"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={handleOpenEditor}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <span>Open Builder</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
