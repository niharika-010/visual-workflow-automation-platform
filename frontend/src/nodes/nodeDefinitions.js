import {
  Play,
  Zap,
  Clock,
  Globe,
  Mail,
  MessageSquare,
  Code,
  GitFork,
  Split,
  Timer,
  Database,
  HardDrive,
} from 'lucide-react';

export const NODE_DEFINITIONS = {
  // --- TRIGGERS ---
  manual: {
    type: 'manual',
    label: 'Manual Trigger',
    category: 'Triggers',
    description: 'Triggers workflow execution manually from dashboard or editor',
    icon: Play,
    color: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10',
    inputs: [],
    outputs: [{ id: 'output', label: 'Output' }],
    defaultConfig: {
      notes: 'Triggers on demand',
    },
    configSchema: [
      { name: 'notes', label: 'Trigger Notes', type: 'text', placeholder: 'Optional notes for manual trigger execution' },
    ],
  },

  webhook: {
    type: 'webhook',
    label: 'Webhook Trigger',
    category: 'Triggers',
    description: 'Triggers workflow when an HTTP request is received',
    icon: Zap,
    color: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
    inputs: [],
    outputs: [{ id: 'output', label: 'Output' }],
    defaultConfig: {
      httpMethod: 'POST',
      path: '/api/webhooks/default-hook',
    },
    configSchema: [
      {
        name: 'httpMethod',
        label: 'HTTP Method',
        type: 'select',
        options: ['POST', 'GET', 'PUT', 'ANY'],
        required: true,
      },
      {
        name: 'path',
        label: 'Webhook Endpoint Path',
        type: 'text',
        placeholder: '/api/webhooks/orders',
        required: true,
      },
    ],
  },

  schedule: {
    type: 'schedule',
    label: 'Schedule Trigger',
    category: 'Triggers',
    description: 'Triggers workflow execution on a recurring time interval or cron',
    icon: Clock,
    color: 'text-sky-400 border-sky-500/30 bg-sky-500/10',
    inputs: [],
    outputs: [{ id: 'output', label: 'Output' }],
    defaultConfig: {
      interval: '15_minutes',
      cron: '*/15 * * * *',
    },
    configSchema: [
      {
        name: 'interval',
        label: 'Interval Frequency',
        type: 'select',
        options: ['5_minutes', '15_minutes', '1_hour', '1_day', 'custom_cron'],
        required: true,
      },
      {
        name: 'cron',
        label: 'Cron Expression',
        type: 'text',
        placeholder: '*/15 * * * *',
        required: true,
        helpText: 'Standard 5-field cron expression',
      },
    ],
  },

  // --- ACTIONS ---
  httpRequest: {
    type: 'httpRequest',
    label: 'HTTP Request',
    category: 'Actions',
    description: 'Executes an HTTP REST API call to external endpoints',
    icon: Globe,
    color: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
    inputs: [{ id: 'input', label: 'Input' }],
    outputs: [{ id: 'output', label: 'Output' }],
    defaultConfig: {
      method: 'GET',
      url: 'https://api.example.com/v1/data',
      headers: '{\n  "Content-Type": "application/json"\n}',
      queryParams: 'page=1&limit=10',
      body: '{\n  "key": "value"\n}',
    },
    configSchema: [
      {
        name: 'method',
        label: 'HTTP Method',
        type: 'select',
        options: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        required: true,
      },
      {
        name: 'url',
        label: 'Request URL',
        type: 'text',
        placeholder: 'https://api.example.com/v1/endpoint',
        required: true,
      },
      {
        name: 'headers',
        label: 'Headers (JSON Format)',
        type: 'code',
        placeholder: '{\n  "Authorization": "Bearer token"\n}',
      },
      {
        name: 'queryParams',
        label: 'Query Parameters',
        type: 'text',
        placeholder: 'search=test&page=1',
      },
      {
        name: 'body',
        label: 'Request Body (JSON Format)',
        type: 'code',
        placeholder: '{\n  "message": "Hello World"\n}',
      },
    ],
  },

  email: {
    type: 'email',
    label: 'Send Email',
    category: 'Actions',
    description: 'Sends automated email notifications to specified recipients',
    icon: Mail,
    color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    inputs: [{ id: 'input', label: 'Input' }],
    outputs: [{ id: 'output', label: 'Output' }],
    defaultConfig: {
      to: 'user@example.com',
      subject: 'Workflow Execution Notification',
      body: 'Hello,\nYour workflow executed successfully!',
    },
    configSchema: [
      {
        name: 'to',
        label: 'Recipient Email (To)',
        type: 'text',
        placeholder: 'engineer@company.com',
        required: true,
      },
      {
        name: 'subject',
        label: 'Email Subject',
        type: 'text',
        placeholder: 'Order Confirmation #1042',
        required: true,
      },
      {
        name: 'body',
        label: 'Email Body / Message',
        type: 'textarea',
        placeholder: 'Enter message body...',
        required: true,
      },
    ],
  },

  slack: {
    type: 'slack',
    label: 'Slack Message',
    category: 'Actions',
    description: 'Posts automated alerts and notifications to a Slack channel',
    icon: MessageSquare,
    color: 'text-pink-400 border-pink-500/30 bg-pink-500/10',
    inputs: [{ id: 'input', label: 'Input' }],
    outputs: [{ id: 'output', label: 'Output' }],
    defaultConfig: {
      channel: '#general',
      message: '🚨 Alert: Workflow trigger executed successfully.',
    },
    configSchema: [
      {
        name: 'channel',
        label: 'Slack Channel Name',
        type: 'text',
        placeholder: '#alerts-production',
        required: true,
      },
      {
        name: 'message',
        label: 'Slack Notification Message',
        type: 'textarea',
        placeholder: 'Enter Slack message text...',
        required: true,
      },
    ],
  },

  code: {
    type: 'code',
    label: 'JavaScript / Code',
    category: 'Actions',
    description: 'Executes custom JavaScript transformation script',
    icon: Code,
    color: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
    inputs: [{ id: 'input', label: 'Input' }],
    outputs: [{ id: 'output', label: 'Output' }],
    defaultConfig: {
      codeScript: '// Access incoming data via items\nreturn items.map(item => ({\n  ...item,\n  processedAt: new Date().toISOString()\n}));',
    },
    configSchema: [
      {
        name: 'codeScript',
        label: 'JavaScript Code Editor',
        type: 'code',
        placeholder: 'return items.map(x => x);',
        required: true,
        helpText: 'Return transformed JSON data array',
      },
    ],
  },

  // --- LOGIC ---
  if: {
    type: 'if',
    label: 'IF Condition',
    category: 'Logic',
    description: 'Evaluates conditional expression to branch into True/False outputs',
    icon: GitFork,
    color: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
    inputs: [{ id: 'input', label: 'Input' }],
    outputs: [
      { id: 'true', label: 'True' },
      { id: 'false', label: 'False' },
    ],
    defaultConfig: {
      field: 'payload.status',
      operator: 'equals',
      value: '200',
    },
    configSchema: [
      {
        name: 'field',
        label: 'Field Path to Evaluate',
        type: 'text',
        placeholder: 'payload.status or items[0].total',
        required: true,
      },
      {
        name: 'operator',
        label: 'Comparison Operator',
        type: 'select',
        options: ['equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'is_true', 'is_false'],
        required: true,
      },
      {
        name: 'value',
        label: 'Target Value',
        type: 'text',
        placeholder: '200 or active',
        required: true,
      },
    ],
  },

  switch: {
    type: 'switch',
    label: 'Switch Logic',
    category: 'Logic',
    description: 'Routes execution based on multi-value field matching',
    icon: Split,
    color: 'text-orange-400 border-orange-500/30 bg-orange-500/10',
    inputs: [{ id: 'input', label: 'Input' }],
    outputs: [{ id: 'output', label: 'Output' }],
    defaultConfig: {
      field: 'payload.event_type',
      cases: 'order_created, order_refunded, user_signup',
    },
    configSchema: [
      {
        name: 'field',
        label: 'Switch Field Variable',
        type: 'text',
        placeholder: 'payload.event_type',
        required: true,
      },
      {
        name: 'cases',
        label: 'Comma Separated Match Cases',
        type: 'text',
        placeholder: 'case_a, case_b, case_c',
        required: true,
      },
    ],
  },

  delay: {
    type: 'delay',
    label: 'Time Delay',
    category: 'Logic',
    description: 'Pauses workflow execution for a specified duration',
    icon: Timer,
    color: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
    inputs: [{ id: 'input', label: 'Input' }],
    outputs: [{ id: 'output', label: 'Output' }],
    defaultConfig: {
      duration: '5',
      unit: 'seconds',
    },
    configSchema: [
      {
        name: 'duration',
        label: 'Delay Duration Amount',
        type: 'number',
        placeholder: '5',
        required: true,
      },
      {
        name: 'unit',
        label: 'Time Unit',
        type: 'select',
        options: ['seconds', 'minutes', 'hours', 'days'],
        required: true,
      },
    ],
  },

  // --- DATABASE ---
  postgres: {
    type: 'postgres',
    label: 'PostgreSQL',
    category: 'Database',
    description: 'Executes SQL statements against PostgreSQL database',
    icon: Database,
    color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
    inputs: [{ id: 'input', label: 'Input' }],
    outputs: [{ id: 'output', label: 'Output' }],
    defaultConfig: {
      query: 'SELECT * FROM users WHERE status = $1 LIMIT 10;',
      parameters: '["active"]',
    },
    configSchema: [
      {
        name: 'query',
        label: 'SQL Query Command',
        type: 'code',
        placeholder: 'SELECT * FROM orders WHERE user_id = $1;',
        required: true,
      },
      {
        name: 'parameters',
        label: 'Query Parameters (JSON Array)',
        type: 'text',
        placeholder: '["active", 100]',
      },
    ],
  },

  redis: {
    type: 'redis',
    label: 'Redis Cache',
    category: 'Database',
    description: 'Performs key-value operations in Redis cache',
    icon: HardDrive,
    color: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
    inputs: [{ id: 'input', label: 'Input' }],
    outputs: [{ id: 'output', label: 'Output' }],
    defaultConfig: {
      command: 'GET',
      key: 'user_session:1042',
      value: '',
      ttl: '3600',
    },
    configSchema: [
      {
        name: 'command',
        label: 'Redis Command',
        type: 'select',
        options: ['GET', 'SET', 'DEL', 'EXISTS', 'INCR'],
        required: true,
      },
      {
        name: 'key',
        label: 'Cache Key',
        type: 'text',
        placeholder: 'user_cache_key',
        required: true,
      },
      {
        name: 'value',
        label: 'Value (for SET)',
        type: 'textarea',
        placeholder: '{"sessionToken": "abc123"}',
      },
      {
        name: 'ttl',
        label: 'TTL Expiration (Seconds)',
        type: 'number',
        placeholder: '3600',
      },
    ],
  },
};

export const getNodeDefinition = (type) => {
  return NODE_DEFINITIONS[type] || NODE_DEFINITIONS.manual;
};
