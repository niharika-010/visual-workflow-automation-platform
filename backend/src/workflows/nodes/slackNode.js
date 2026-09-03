import { BaseNode } from './baseNode.js';
import axios from 'axios';
import { getCredentialById } from '../../models/credential.model.js';

export class SlackNode extends BaseNode {
  constructor() {
    super('slack');
  }

  async execute(context) {
    const { config = {} } = context;
    const { channel, message, webhookUrl: configUrl, credentialId } = config;

    let webhookUrl = configUrl || process.env.SLACK_WEBHOOK_URL;

    if (credentialId) {
      const cred = await getCredentialById(credentialId);
      if (cred && cred.data?.webhookUrl) {
        webhookUrl = cred.data.webhookUrl;
      }
    }

    try {
      if (webhookUrl && webhookUrl.startsWith('http')) {
        const slackPayload = {
          channel: channel || undefined,
          text: message || '🚨 Workflow Alert Notification',
        };

        const response = await axios.post(webhookUrl, slackPayload, { timeout: 10000 });

        return {
          success: true,
          data: {
            posted: true,
            status: response.status,
            channel: channel || 'webhook_default',
            message,
            timestamp: new Date().toISOString(),
          },
        };
      }

      // Mock fallback if no webhook URL is configured
      return {
        success: true,
        data: {
          posted: true,
          mode: 'mock',
          channel: channel || '#general',
          message: message || 'Notification alert',
          timestamp: new Date().toISOString(),
        },
      };
    } catch (err) {
      return {
        success: false,
        error: `Slack notification failed: ${err.message}`,
        data: { error: err.message },
      };
    }
  }
}
