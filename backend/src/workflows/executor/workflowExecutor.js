import {
  createExecutionRecord,
  updateExecutionRecord,
  createExecutionStepRecord,
  updateExecutionStepRecord,
} from '../../models/execution.model.js';
import { getNodeHandler } from '../nodes/index.js';

export const executeWorkflowGraph = async ({ workflow, initialData = {}, existingExecutionId = null }) => {
  const workflowJson = typeof workflow.workflow_json === 'string'
    ? JSON.parse(workflow.workflow_json)
    : workflow.workflow_json || { nodes: [], edges: [] };

  const { nodes = [], edges = [] } = workflowJson;

  if (nodes.length === 0) {
    throw new Error('Workflow contains no nodes to execute');
  }

  let executionId = existingExecutionId;

  if (!executionId) {
    const executionRecord = await createExecutionRecord({
      workflowId: workflow.id,
      inputData: initialData,
      initialStatus: 'running',
    });
    executionId = executionRecord.id;
  } else {
    await updateExecutionRecord(executionId, {
      status: 'running',
      outputData: {},
      error: null,
    });
  }

  // Build incoming/outgoing adjacency maps
  const outgoingEdges = new Map();
  const incomingEdges = new Map();

  for (const node of nodes) {
    outgoingEdges.set(node.id, []);
    incomingEdges.set(node.id, []);
  }

  for (const edge of edges) {
    if (outgoingEdges.has(edge.source)) {
      outgoingEdges.get(edge.source).push(edge);
    }
    if (incomingEdges.has(edge.target)) {
      incomingEdges.get(edge.target).push(edge);
    }
  }

  // Identify starting node
  let startNode = nodes.find((n) => {
    const type = n.data?.nodeType || n.type;
    return ['manual', 'webhook', 'schedule'].includes(type);
  });

  if (!startNode) {
    startNode = nodes.find((n) => (incomingEdges.get(n.id) || []).length === 0) || nodes[0];
  }

  const queue = [startNode];
  const executedNodeIds = new Set();
  const nodeOutputs = {};

  try {
    while (queue.length > 0) {
      const currentNode = queue.shift();

      if (executedNodeIds.has(currentNode.id)) continue;
      executedNodeIds.add(currentNode.id);

      const nodeType = currentNode.data?.nodeType || currentNode.type || 'manual';
      const nodeConfig = currentNode.data?.config || {};
      const handler = getNodeHandler(nodeType);

      // Determine inputData for current node
      let nodeInputData = initialData;
      const parents = incomingEdges.get(currentNode.id) || [];
      if (parents.length > 0) {
        const parentOutputs = parents
          .map((e) => nodeOutputs[e.source])
          .filter((out) => out !== undefined);

        nodeInputData = parentOutputs.length === 1 ? parentOutputs[0] : { inputs: parentOutputs };
      }

      // Create step log record
      const stepRecord = await createExecutionStepRecord({
        executionId,
        nodeId: currentNode.id,
        inputData: nodeInputData,
      });

      // Execute node handler
      const result = await handler.execute({
        inputData: nodeInputData,
        config: nodeConfig,
        node: currentNode,
        executionId,
      });

      if (!result.success) {
        await updateExecutionStepRecord(stepRecord.id, {
          executionId,
          status: 'failed',
          outputData: result.data || {},
          error: result.error || 'Node execution failed',
        });

        await updateExecutionRecord(executionId, {
          status: 'failed',
          outputData: nodeOutputs,
          error: `Node "${currentNode.data?.label || currentNode.id}" failed: ${result.error}`,
        });

        return {
          success: false,
          executionId,
          status: 'failed',
          error: `Node "${currentNode.data?.label || currentNode.id}" failed: ${result.error}`,
          outputs: nodeOutputs,
        };
      }

      // Record step completion
      await updateExecutionStepRecord(stepRecord.id, {
        executionId,
        status: 'completed',
        outputData: result.data || {},
        error: null,
      });

      nodeOutputs[currentNode.id] = result.data;

      // Determine next downstream nodes
      const nodeOutgoing = outgoingEdges.get(currentNode.id) || [];
      let eligibleEdges = nodeOutgoing;

      if (nodeType === 'if' && result.nextHandle) {
        eligibleEdges = nodeOutgoing.filter((e) => e.sourceHandle === result.nextHandle);
      }

      for (const edge of eligibleEdges) {
        const targetNode = nodes.find((n) => n.id === edge.target);
        if (targetNode && !executedNodeIds.has(targetNode.id)) {
          queue.push(targetNode);
        }
      }
    }

    // Workflow execution completed successfully
    await updateExecutionRecord(executionId, {
      status: 'completed',
      outputData: nodeOutputs,
      error: null,
    });

    return {
      success: true,
      executionId,
      status: 'completed',
      outputs: nodeOutputs,
    };
  } catch (err) {
    await updateExecutionRecord(executionId, {
      status: 'failed',
      outputData: nodeOutputs,
      error: err.message,
    });

    return {
      success: false,
      executionId,
      status: 'failed',
      error: err.message,
      outputs: nodeOutputs,
    };
  }
};
