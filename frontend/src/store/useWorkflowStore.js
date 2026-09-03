import { create } from 'zustand';
import { fetchHealthStatus } from '../services/api';

const initialNodes = [
  {
    id: 'node-1',
    type: 'input',
    data: { label: '⚡ Webhook Trigger' },
    position: { x: 100, y: 150 },
    style: {
      background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
      color: '#e0e7ff',
      border: '1px solid #6366f1',
      padding: '12px 20px',
      fontSize: '14px',
      fontWeight: '600',
    },
  },
  {
    id: 'node-2',
    data: { label: '🔀 IF/Else Logic' },
    position: { x: 380, y: 150 },
    style: {
      background: 'linear-gradient(135deg, #311b92 0%, #4a148c 100%)',
      color: '#f3e8ff',
      border: '1px solid #a855f7',
      padding: '12px 20px',
      fontSize: '14px',
      fontWeight: '600',
    },
  },
  {
    id: 'node-3',
    type: 'output',
    data: { label: '📧 Send Email' },
    position: { x: 680, y: 80 },
    style: {
      background: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)',
      color: '#d1fae5',
      border: '1px solid #10b981',
      padding: '12px 20px',
      fontSize: '14px',
      fontWeight: '600',
    },
  },
  {
    id: 'node-4',
    type: 'output',
    data: { label: '💬 Post Slack Alert' },
    position: { x: 680, y: 220 },
    style: {
      background: 'linear-gradient(135deg, #701a75 0%, #831843 100%)',
      color: '#fce7f3',
      border: '1px solid #ec4899',
      padding: '12px 20px',
      fontSize: '14px',
      fontWeight: '600',
    },
  },
];

const initialEdges = [
  { id: 'e1-2', source: 'node-1', target: 'node-2', animated: true, style: { stroke: '#818cf8' } },
  { id: 'e2-3', source: 'node-2', target: 'node-3', label: 'True', style: { stroke: '#34d399' } },
  { id: 'e2-4', source: 'node-2', target: 'node-4', label: 'False', style: { stroke: '#f472b6' } },
];

export const useWorkflowStore = create((set, get) => ({
  nodes: initialNodes,
  edges: initialEdges,
  healthData: null,
  isHealthLoading: false,
  healthError: null,

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  checkHealth: async () => {
    set({ isHealthLoading: true, healthError: null });
    try {
      const data = await fetchHealthStatus(true);
      set({ healthData: data, isHealthLoading: false });
    } catch (err) {
      set({ healthError: err.message, isHealthLoading: false });
    }
  },
}));
