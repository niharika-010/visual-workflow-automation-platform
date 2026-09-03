import { BaseNode } from './baseNode.js';

export class WebhookNode extends BaseNode {
  constructor() {
    super('webhook');
  }

  async execute(context) {
    const { inputData = {}, config = {} } = context;
    return {
      success: true,
      data: {
        trigger: 'webhook',
        httpMethod: config.httpMethod || 'POST',
        path: config.path || '/api/webhooks/default',
        receivedAt: new Date().toISOString(),
        payload: inputData,
      },
    };
  }
}
