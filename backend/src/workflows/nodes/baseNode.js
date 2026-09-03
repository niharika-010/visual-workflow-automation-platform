export class BaseNode {
  constructor(nodeType) {
    this.nodeType = nodeType;
  }

  /**
   * Execute node logic
   * @param {Object} context { inputData, config, node, executionId }
   * @returns {Promise<{ success: boolean, data: any, nextHandle?: string, error?: string }>}
   */
  async execute(context) {
    throw new Error(`Execute method must be implemented by node handler for ${this.nodeType}`);
  }

  // Helper to safely extract nested property values (e.g. "payload.user.id" or "data.status")
  getValueByPath(obj, path) {
    if (!obj || !path) return undefined;
    const parts = path.toString().split('.');
    let current = obj;
    for (const part of parts) {
      if (current === undefined || current === null) return undefined;
      current = current[part];
    }
    return current;
  }
}
