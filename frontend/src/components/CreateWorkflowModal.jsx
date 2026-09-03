import React, { useState } from 'react';
import { useWorkflowManagementStore } from '../store/useWorkflowManagementStore';
import { X, Workflow, AlertCircle, Loader2, Plus } from 'lucide-react';

export const CreateWorkflowModal = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [validationError, setValidationError] = useState('');

  const { isCreateModalOpen, setCreateModalOpen, addWorkflow, isLoading, error } =
    useWorkflowManagementStore();

  if (!isCreateModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (!name || name.trim().length === 0) {
      setValidationError('Workflow name is required.');
      return;
    }

    const result = await addWorkflow({ name: name.trim(), description: description.trim() });
    if (result.success) {
      setName('');
      setDescription('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Workflow className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Create New Workflow</h3>
              <p className="text-xs text-slate-400">Initialize a visual automation canvas</p>
            </div>
          </div>
          <button
            onClick={() => setCreateModalOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Notification */}
        {(error || validationError) && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{validationError || error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Workflow Name <span className="text-indigo-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Customer Onboarding Webhook Flow"
              required
              autoFocus
              className="w-full px-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Description <span className="text-slate-500 font-normal">(Optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Briefly describe what this workflow automates..."
              rows={3}
              className="w-full px-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-800 text-xs font-semibold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 flex items-center space-x-2 cursor-pointer disabled:opacity-50 transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Create Workflow</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
