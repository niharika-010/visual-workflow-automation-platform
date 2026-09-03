import { create } from 'zustand';
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
import {
  fetchWorkflowByIdApi,
  updateWorkflowApi,
  activateWorkflowApi,
  deactivateWorkflowApi,
  fetchWorkflowVersionsApi,
  restoreWorkflowVersionApi,
} from '../services/api';
import { getNodeDefinition } from '../nodes/nodeDefinitions';

let autosaveTimeout = null;

export const useWorkflowEditorStore = create((set, get) => ({
  workflow: null,
  nodes: [],
  edges: [],
  selectedNodeId: null,
  versions: [],
  isVersionsOpen: false,
  isAutosaveEnabled: true,
  isDirty: false,
  isLoading: false,
  isSaving: false,
  error: null,

  // Load workflow from backend API
  loadWorkflow: async (id) => {
    set({ isLoading: true, error: null, selectedNodeId: null });
    try {
      const data = await fetchWorkflowByIdApi(id);
      if (data.status === 'success' && data.workflow) {
        const wf = data.workflow;
        const workflowJson = typeof wf.workflow_json === 'string'
          ? JSON.parse(wf.workflow_json)
          : wf.workflow_json || { nodes: [], edges: [] };

        const rawNodes = workflowJson.nodes || [];
        const safeNodes = rawNodes.map((node, index) => {
          const rawType = node.data?.nodeType || node.type || 'manual';
          const def = getNodeDefinition(rawType);
          return {
            ...node,
            id: node.id || `node_${index}_${Date.now()}`,
            type: 'customNode',
            position: node.position || { x: 250 + index * 200, y: 150 },
            data: {
              nodeType: rawType,
              label: node.data?.label || node.label || def.label,
              details: node.data?.details || node.details || def.description,
              config: node.data?.config || node.config || { ...(def.defaultConfig || {}) },
            },
          };
        });

        set({
          workflow: wf,
          nodes: safeNodes,
          edges: workflowJson.edges || [],
          isDirty: false,
          isLoading: false,
        });

        // Load version history automatically
        get().loadVersions(id);
      } else {
        throw new Error('Failed to load workflow');
      }
    } catch (err) {
      set({
        error: err.response?.data?.message || err.message || 'Workflow not found',
        isLoading: false,
      });
    }
  },

  // Save workflow canvas state to backend API
  saveWorkflow: async () => {
    const { workflow, nodes, edges } = get();
    if (!workflow) return { success: false };

    set({ isSaving: true, error: null });
    try {
      const workflowJson = { nodes, edges };
      const data = await updateWorkflowApi(workflow.id, {
        name: workflow.name,
        description: workflow.description,
        status: workflow.status,
        workflow_json: workflowJson,
      });

      if (data.status === 'success' && data.workflow) {
        set({
          workflow: data.workflow,
          isDirty: false,
          isSaving: false,
        });

        // Reload version history list after save
        get().loadVersions(workflow.id);
        return { success: true, workflow: data.workflow };
      }
      throw new Error(data.message || 'Save failed');
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to save workflow';
      set({ error: message, isSaving: false });
      return { success: false, error: message };
    }
  },

  // Load version history for current workflow
  loadVersions: async (id) => {
    const targetId = id || get().workflow?.id;
    if (!targetId) return;

    try {
      const data = await fetchWorkflowVersionsApi(targetId);
      if (data.status === 'success') {
        set({ versions: data.versions || [] });
      }
    } catch (err) {
      console.error('Failed to load workflow versions:', err);
    }
  },

  // Restore previous version
  restoreVersion: async (versionId) => {
    const { workflow } = get();
    if (!workflow) return { success: false };

    set({ isSaving: true, error: null });
    try {
      const data = await restoreWorkflowVersionApi(workflow.id, versionId);
      if (data.status === 'success' && data.workflow) {
        const wf = data.workflow;
        const workflowJson = typeof wf.workflow_json === 'string'
          ? JSON.parse(wf.workflow_json)
          : wf.workflow_json || { nodes: [], edges: [] };

        const rawNodes = workflowJson.nodes || [];
        const safeNodes = rawNodes.map((node, index) => {
          const rawType = node.data?.nodeType || node.type || 'manual';
          const def = getNodeDefinition(rawType);
          return {
            ...node,
            id: node.id || `node_${index}_${Date.now()}`,
            type: 'customNode',
            position: node.position || { x: 250 + index * 200, y: 150 },
            data: {
              nodeType: rawType,
              label: node.data?.label || node.label || def.label,
              details: node.data?.details || node.details || def.description,
              config: node.data?.config || node.config || { ...(def.defaultConfig || {}) },
            },
          };
        });

        set({
          workflow: wf,
          nodes: safeNodes,
          edges: workflowJson.edges || [],
          isDirty: false,
          isSaving: false,
          selectedNodeId: null,
        });

        get().loadVersions(workflow.id);
        return { success: true, workflow: wf };
      }
      throw new Error(data.message || 'Restore failed');
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to restore version';
      set({ error: message, isSaving: false });
      return { success: false, error: message };
    }
  },

  // Debounced Autosave Trigger (2000ms after last change)
  triggerAutosave: () => {
    const { isAutosaveEnabled, saveWorkflow } = get();
    if (!isAutosaveEnabled) return;

    if (autosaveTimeout) clearTimeout(autosaveTimeout);

    autosaveTimeout = setTimeout(() => {
      saveWorkflow();
    }, 2000);
  },

  // Toggle active / inactive status
  toggleStatus: async () => {
    const { workflow } = get();
    if (!workflow) return;

    const isActivating = workflow.status !== 'active';
    try {
      const data = isActivating
        ? await activateWorkflowApi(workflow.id)
        : await deactivateWorkflowApi(workflow.id);

      if (data.status === 'success' && data.workflow) {
        set({
          workflow: { ...workflow, status: data.workflow.status },
        });
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  },

  // React Flow node changes
  onNodesChange: (changes) => {
    const isDragging = changes.some((c) => c.type === 'position' && c.dragging);

    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes),
      isDirty: true,
    }));

    // Trigger autosave only when dragging finishes or non-dragging change occurs
    if (!isDragging) {
      get().triggerAutosave();
    }
  },

  // React Flow edge changes
  onEdgesChange: (changes) => {
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
      isDirty: true,
    }));
    get().triggerAutosave();
  },

  // Connect two node handles
  onConnect: (connection) => {
    set((state) => ({
      edges: addEdge(
        {
          ...connection,
          animated: true,
          style: { stroke: '#0d9488', strokeWidth: 2.5 },
        },
        state.edges
      ),
      isDirty: true,
    }));
    get().triggerAutosave();
  },

  // Add node from Drag-and-Drop
  addNode: (nodeType, position) => {
    const id = `node_${Date.now()}`;
    const def = getNodeDefinition(nodeType);

    const newNode = {
      id,
      type: 'customNode',
      position: position || { x: 250, y: 150 },
      data: {
        nodeType,
        label: def.label,
        details: def.description,
        config: { ...(def.defaultConfig || {}) },
      },
    };

    set((state) => ({
      nodes: [...state.nodes, newNode],
      selectedNodeId: id,
      isDirty: true,
    }));
    get().triggerAutosave();
  },

  // Update node data and config
  updateNodeData: (id, updatedData, updatedConfig = {}) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id !== id) return node;
        const currentData = node.data || {};
        const currentConfig = currentData.config || {};
        return {
          ...node,
          data: {
            ...currentData,
            ...updatedData,
            config: {
              ...currentConfig,
              ...updatedConfig,
            },
          },
        };
      }),
      isDirty: true,
    }));
    get().triggerAutosave();
  },

  // Delete node
  deleteNode: (id) => {
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== id),
      edges: state.edges.filter((edge) => edge.source !== id && edge.target !== id),
      selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
      isDirty: true,
    }));
    get().triggerAutosave();
  },

  selectNode: (id) => set({ selectedNodeId: id }),
  setVersionsOpen: (isOpen) => set({ isVersionsOpen: isOpen }),
  setAutosaveEnabled: (enabled) => set({ isAutosaveEnabled: enabled }),
}));
