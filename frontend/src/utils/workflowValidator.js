import { getNodeDefinition } from '../nodes/nodeDefinitions';

export const validateWorkflowGraph = (nodes = [], edges = []) => {
  const errors = [];

  if (!nodes || nodes.length === 0) {
    errors.push({
      type: 'general',
      message: 'Workflow canvas is empty. Add nodes before saving or activating.',
    });
    return { isValid: false, errors };
  }

  // 1. Check for starting trigger node
  const triggerNode = nodes.find((node) => {
    const nodeType = node.data?.nodeType || node.type;
    const def = getNodeDefinition(nodeType);
    return def.category === 'Triggers';
  });

  if (!triggerNode) {
    errors.push({
      type: 'trigger_missing',
      message: 'Workflow must contain at least one Trigger node (e.g. Manual, Webhook, or Schedule).',
    });
  }

  // Build adjacency maps
  const connectedNodeIds = new Set();
  edges.forEach((edge) => {
    connectedNodeIds.add(edge.source);
    connectedNodeIds.add(edge.target);
  });

  // 2. Validate individual node configurations
  nodes.forEach((node) => {
    const nodeType = node.data?.nodeType || node.type || 'manual';
    const def = getNodeDefinition(nodeType);
    const config = node.data?.config || {};

    // Check required fields from schema
    (def.configSchema || []).forEach((field) => {
      if (field.required && (!config[field.name] || config[field.name].toString().trim() === '')) {
        errors.push({
          type: 'node_config',
          nodeId: node.id,
          nodeLabel: node.data?.label || def.label,
          message: `Node "${node.data?.label || def.label}" is missing required field: ${field.label}`,
        });
      }
    });

    // Check for orphaned nodes if graph has more than 1 node
    if (nodes.length > 1 && !connectedNodeIds.has(node.id) && def.category !== 'Triggers') {
      errors.push({
        type: 'orphaned_node',
        nodeId: node.id,
        nodeLabel: node.data?.label || def.label,
        message: `Node "${node.data?.label || def.label}" is disconnected from the workflow graph.`,
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};
