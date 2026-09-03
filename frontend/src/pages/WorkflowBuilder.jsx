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
        fitViewOptions={{ padding: 0.2 }}
        fitView={nodes.length > 0 ? false : true}
      >
        <Background color="#1e293b" gap={20} size={1.5} />
        <Controls className="bg-slate-900! border-slate-800! text-slate-300! fill-slate-300!" />
        <MiniMap
          nodeColor={() => '#0d9488'}
          maskColor="rgba(8, 12, 20, 0.75)"
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
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
          <p className="text-sm font-medium text-slate-400">Loading visual workflow editor...</p>
        </div>
      </div>
    );
  }

  if (error && !workflow) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center max-w-md space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">Workflow Not Found</h2>
          <p className="text-xs text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <div className="min-h-screen bg-[#080c14] flex flex-col font-sans overflow-hidden">
        <EditorHeader />

        <div className="flex-1 flex overflow-hidden">
          {/* Left Draggable Node Catalog */}
          <NodePanel />

          {/* Center Drag-and-Drop Canvas */}
          <CanvasContent />

          {/* Right Node Configuration Panel */}
          <NodeConfigPanel />
        </div>
      </div>
    </ReactFlowProvider>
  );
}
