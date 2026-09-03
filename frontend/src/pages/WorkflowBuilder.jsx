import React, { useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import { useWorkflowEditorStore } from '../store/useWorkflowEditorStore';
import { CustomNode } from '../components/editor/CustomNode';
import { NodePanel } from '../components/editor/NodePanel';
import { NodeConfigPanel } from '../components/editor/NodeConfigPanel';
import { EditorHeader } from '../components/editor/EditorHeader';
import { Loader2, AlertCircle } from 'lucide-react';

const nodeTypes = {
  customNode: CustomNode,
};

function CanvasContent() {
  const reactFlowWrapper = useRef(null);
  const { screenToFlowPosition } = useReactFlow();

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    selectNode,
    selectedNodeId,
    deleteNode,
  } = useWorkflowEditorStore();

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      addNode(type, position);
    },
    [screenToFlowPosition, addNode]
  );

  return (
    <div className="flex-1 h-full relative" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => selectNode(node.id)}
        onPaneClick={() => selectNode(null)}
        onDragOver={onDragOver}
        onDrop={onDrop}
        deleteKeyCode={['Backspace', 'Delete']}
        fitView
      >
        <Background color="#334155" gap={20} size={1} />
        <Controls className="bg-slate-900! border-slate-800! text-slate-300! fill-slate-300!" />
        <MiniMap
          nodeColor={(node) => '#6366f1'}
          maskColor="rgba(15, 23, 42, 0.7)"
          className="bg-slate-900! border-slate-800! rounded-xl! overflow-hidden!"
        />
      </ReactFlow>
    </div>
  );
}

export default function WorkflowBuilder() {
  const { id } = useParams();
  const { loadWorkflow, isLoading, error, workflow } = useWorkflowEditorStore();

  useEffect(() => {
    if (id) {
      loadWorkflow(id);
    }
  }, [id, loadWorkflow]);

  if (isLoading && !workflow) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-sm font-medium text-slate-400">Loading visual workflow editor...</p>
        </div>
      </div>
    );
  }

  if (error && !workflow) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center max-w-md space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">Workflow Not Found</h2>
          <p className="text-xs text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] flex flex-col font-['Plus_Jakarta_Sans',sans-serif] overflow-hidden">
      <EditorHeader />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Draggable Node Catalog */}
        <NodePanel />

        {/* Center Drag-and-Drop Canvas */}
        <ReactFlowProvider>
          <CanvasContent />
        </ReactFlowProvider>

        {/* Right Node Configuration Panel */}
        <NodeConfigPanel />
      </div>
    </div>
  );
}
