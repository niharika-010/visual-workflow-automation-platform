import React, { useCallback } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from '@xyflow/react';
import { useWorkflowStore } from '../store/useWorkflowStore';
import { Play, Plus, Zap, Code, Mail, MessageSquare, GitFork } from 'lucide-react';

export const CanvasPreview = () => {
  const { nodes, edges, setNodes, setEdges } = useWorkflowStore();

  const onNodesChange = useCallback(
    (changes) => setNodes(applyNodeChanges(changes, nodes)),
    [nodes, setNodes]
  );

  const onEdgesChange = useCallback(
    (changes) => setEdges(applyEdgeChanges(changes, edges)),
    [edges, setEdges]
  );

  const onConnect = useCallback(
    (params) => setEdges(addEdge({ ...params, animated: true, style: { stroke: '#6366f1' } }, edges)),
    [edges, setEdges]
  );

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl">
      {/* Canvas Header & Toolbar */}
      <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm sm:text-base">Visual Workflow Designer</h3>
            <p className="text-xs text-slate-400">Interactive Node Graph (React Flow + Zustand)</p>
          </div>
        </div>

        {/* Future Integrations Quick Badges */}
        <div className="hidden lg:flex items-center space-x-2 text-xs text-slate-400">
          <span className="text-slate-500 font-semibold mr-1">Prepared Nodes:</span>
          <span className="px-2 py-1 rounded bg-slate-800 text-indigo-300 border border-slate-700 flex items-center gap-1">
            <Zap className="w-3 h-3" /> Webhook
          </span>
          <span className="px-2 py-1 rounded bg-slate-800 text-purple-300 border border-slate-700 flex items-center gap-1">
            <GitFork className="w-3 h-3" /> IF/Else
          </span>
          <span className="px-2 py-1 rounded bg-slate-800 text-emerald-300 border border-slate-700 flex items-center gap-1">
            <Mail className="w-3 h-3" /> Email
          </span>
          <span className="px-2 py-1 rounded bg-slate-800 text-pink-300 border border-slate-700 flex items-center gap-1">
            <MessageSquare className="w-3 h-3" /> Slack
          </span>
          <span className="px-2 py-1 rounded bg-slate-800 text-amber-300 border border-slate-700 flex items-center gap-1">
            <Code className="w-3 h-3" /> JS Code
          </span>
        </div>
      </div>

      {/* React Flow Viewport Container */}
      <div className="h-[420px] w-full relative bg-[#0b0f19]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
        >
          <Background color="#334155" gap={20} size={1} />
          <Controls className="bg-slate-900! border-slate-800! text-slate-300! fill-slate-300!" />
        </ReactFlow>

        {/* Canvas floating prompt */}
        <div className="absolute bottom-4 right-4 bg-slate-900/90 border border-slate-800 text-xs text-slate-400 px-3 py-1.5 rounded-lg backdrop-blur-md shadow-lg pointer-events-none">
          💡 Drag and connect nodes to test interactive canvas state
        </div>
      </div>
    </div>
  );
};
