const VALID_NODE_TYPES = [
  'customNode',
  'manual',
  'webhook',
  'schedule',
  'httpRequest',
  'email',
  'slack',
  'code',
  'if',
  'switch',
  'delay',
  'postgres',
  'redis',
];

export const validateWorkflowSchema = (req, res, next) => {
  const { workflow_json } = req.body;

  // If payload does not update workflow_json (e.g. metadata-only update), skip canvas validation
  if (workflow_json === undefined) {
    return next();
  }

  let parsedJson = workflow_json;

  if (typeof workflow_json === 'string') {
    try {
      parsedJson = JSON.parse(workflow_json);
    } catch (e) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid workflow JSON document: Malformed JSON string',
      });
    }
  }

  if (!parsedJson || typeof parsedJson !== 'object') {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid workflow JSON document: Must be a non-null object',
    });
  }

  const { nodes, edges } = parsedJson;

  // Validate nodes array
  if (!Array.isArray(nodes)) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid workflow structure: "nodes" must be an array',
    });
  }

  const nodeIds = new Set();

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (!node || typeof node !== 'object') {
      return res.status(400).json({
        status: 'error',
        message: `Invalid node at index ${i}: Must be an object`,
      });
    }

    if (!node.id || typeof node.id !== 'string') {
      return res.status(400).json({
        status: 'error',
        message: `Invalid node at index ${i}: Missing or invalid node ID`,
      });
    }

    if (!node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
      return res.status(400).json({
        status: 'error',
        message: `Invalid node "${node.id}": Missing position coordinates (x, y)`,
      });
    }

    if (!node.data || typeof node.data !== 'object') {
      return res.status(400).json({
        status: 'error',
        message: `Invalid node "${node.id}": Missing node "data" object`,
      });
    }

    nodeIds.add(node.id);
  }

  // Validate edges array
  if (!Array.isArray(edges)) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid workflow structure: "edges" must be an array',
    });
  }

  for (let j = 0; j < edges.length; j++) {
    const edge = edges[j];
    if (!edge || typeof edge !== 'object') {
      return res.status(400).json({
        status: 'error',
        message: `Invalid edge at index ${j}: Must be an object`,
      });
    }

    if (!edge.id || typeof edge.id !== 'string') {
      return res.status(400).json({
        status: 'error',
        message: `Invalid edge at index ${j}: Missing or invalid edge ID`,
      });
    }

    if (!edge.source || typeof edge.source !== 'string' || !nodeIds.has(edge.source)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid edge "${edge.id}": Source node "${edge.source}" does not exist in workflow nodes list`,
      });
    }

    if (!edge.target || typeof edge.target !== 'string' || !nodeIds.has(edge.target)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid edge "${edge.id}": Target node "${edge.target}" does not exist in workflow nodes list`,
      });
    }
  }

  // Attach normalized workflow_json object to req for controller
  req.validatedWorkflowJson = parsedJson;
  next();
};
