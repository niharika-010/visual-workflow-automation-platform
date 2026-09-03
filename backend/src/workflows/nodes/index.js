import { ManualNode } from './manualNode.js';
import { WebhookNode } from './webhookNode.js';
import { HttpNode } from './httpNode.js';
import { IfNode } from './ifNode.js';
import { DelayNode } from './delayNode.js';
import { CodeNode } from './codeNode.js';
import { EmailNode } from './emailNode.js';
import { SlackNode } from './slackNode.js';
import { PostgresNode } from './postgresNode.js';
import { RedisNode } from './redisNode.js';

export const nodeRegistry = {
  manual: new ManualNode(),
  webhook: new WebhookNode(),
  httpRequest: new HttpNode(),
  if: new IfNode(),
  delay: new DelayNode(),
  code: new CodeNode(),
  email: new EmailNode(),
  slack: new SlackNode(),
  postgres: new PostgresNode(),
  redis: new RedisNode(),
};

export const getNodeHandler = (nodeType) => {
  return nodeRegistry[nodeType] || nodeRegistry.manual;
};
