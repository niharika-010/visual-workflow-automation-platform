import { BaseNode } from './baseNode.js';

export class CodeNode extends BaseNode {
  constructor() {
    super('code');
  }

  async execute(context) {
    const { inputData = {}, config = {} } = context;
    const codeScript = config.codeScript || 'return inputData;';

    try {
      // Evaluate user transformation function passing items & inputData
      const fn = new Function('items', 'inputData', codeScript);
      const items = Array.isArray(inputData) ? inputData : [inputData];
      const result = fn(items, inputData);

      return {
        success: true,
        data: {
          result,
          executedAt: new Date().toISOString(),
        },
      };
    } catch (err) {
      return {
        success: false,
        error: `JavaScript evaluation failed: ${err.message}`,
        data: { error: err.message },
      };
    }
  }
}
