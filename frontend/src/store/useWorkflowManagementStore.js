import { create } from 'zustand';
import {
  fetchWorkflowsApi,
  createWorkflowApi,
  deleteWorkflowApi,
  activateWorkflowApi,
  deactivateWorkflowApi,
} from '../services/api';

export const useWorkflowManagementStore = create((set, get) => ({
  workflows: [],
  isLoading: false,
  error: null,
  searchQuery: '',
  statusFilter: 'all',
  isCreateModalOpen: false,

  // Load all workflows for current user
  loadWorkflows: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await fetchWorkflowsApi();
      if (data.status === 'success') {
        set({ workflows: data.workflows || [], isLoading: false });
      }
    } catch (err) {
      set({
        error: err.response?.data?.message || 'Failed to load workflows',
        isLoading: false,
      });
    }
  },

  // Create a new workflow
  addWorkflow: async ({ name, description }) => {
    set({ isLoading: true, error: null });
    try {
      const data = await createWorkflowApi({ name, description });
      if (data.status === 'success' && data.workflow) {
        set((state) => ({
          workflows: [data.workflow, ...state.workflows],
          isCreateModalOpen: false,
          isLoading: false,
        }));
        return { success: true, workflow: data.workflow };
      }
      throw new Error(data.message || 'Failed to create workflow');
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to create workflow';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  // Delete a workflow
  removeWorkflow: async (id) => {
    try {
      const data = await deleteWorkflowApi(id);
      if (data.status === 'success') {
        set((state) => ({
          workflows: state.workflows.filter((w) => w.id !== id),
        }));
        return { success: true };
      }
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || 'Failed to delete workflow',
      };
    }
  },

  // Toggle active/deactive status
  toggleWorkflowStatus: async (id, currentStatus) => {
    const isActivating = currentStatus !== 'active';
    try {
      const data = isActivating
        ? await activateWorkflowApi(id)
        : await deactivateWorkflowApi(id);

      if (data.status === 'success' && data.workflow) {
        set((state) => ({
          workflows: state.workflows.map((w) =>
            w.id === id ? { ...w, status: data.workflow.status, updated_at: data.workflow.updated_at } : w
          ),
        }));
        return { success: true, workflow: data.workflow };
      }
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || 'Failed to change workflow status',
      };
    }
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  setStatusFilter: (filter) => set({ statusFilter: filter }),
  setCreateModalOpen: (isOpen) => set({ isCreateModalOpen: isOpen, error: null }),
}));
