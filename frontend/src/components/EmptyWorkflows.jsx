import React from 'react';
import { Workflow, Plus } from 'lucide-react';

export const EmptyWorkflows = ({ onCreateClick }) => {
  return (
    <div className="bg-slate-900/60 border border-slate-800 border-dashed rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-5 shadow-2xl backdrop-blur-xl my-6">
      <div className="h-16 w-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/10">
        <Workflow className="w-8 h-8" />
      </div>

      <div className="space-y-1 max-w-md">
        <h3 className="text-xl font-bold text-white tracking-tight">No workflows yet</h3>
        <p className="text-sm text-slate-400">
          Create your first workflow to automate tasks, connect APIs, and trigger execution pipelines.
        </p>
      </div>

      <button
        onClick={onCreateClick}
        className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs tracking-wide shadow-lg shadow-indigo-600/20 flex items-center space-x-2 transition-all cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        <span>Create your first workflow</span>
      </button>
    </div>
  );
};
