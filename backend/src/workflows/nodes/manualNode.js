import { BaseNode } from './baseNode.js';

export class ManualNode extends BaseNode {
  constructor() {
    super('manual');
  }

  async execute(context) {
    const { inputData = {}, config = {} } = context;
    return {
      success: true,
      data: {
        trigger: 'manual',
        timestamp: new Date().toISOString(),
        notes: config.notes || 'Manual trigger executed',
        payload: inputData,
      },
    };
  }
}
