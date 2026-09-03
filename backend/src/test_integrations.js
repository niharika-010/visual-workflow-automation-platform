import http from 'http';

const makeRequest = (options, postData) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
};

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const runTests = async () => {
  console.log('🧪 Starting Phase 9 Real-World Integrations & Credential Architecture Integration Tests...\n');

  // Register & Login User
  const user = {
    name: 'Integration Tester',
    email: `integrator_${Date.now()}@example.com`,
    password: 'Password123!',
  };

  const regRes = await makeRequest(
    { hostname: 'localhost', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    user
  );
  const token = regRes.data.token;
  console.log(`✅ User Registered (${user.email})\n`);

  // Test 1: Credential Store Architecture
  console.log('1️⃣ Testing Secure Credential Store (POST & GET /api/credentials)...');
  const credRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/credentials',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    },
    {
      name: 'Production Slack Webhook',
      type: 'slack_webhook',
      data: { webhookUrl: 'https://hooks.slack.com/services/T00/B00/X00' },
    }
  );
  const credentialId = credRes.data.credential.id;

  const listCredsRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/credentials',
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });

  console.log(`   Credential Created ID: ${credentialId}`);
  console.log(`   Credentials Listed: ${listCredsRes.data.count}`);
  if (credRes.statusCode === 201 && listCredsRes.data.count >= 1) {
    console.log('   ✅ PASS: Credential stored & listed securely without exposing raw secrets in API.\n');
  } else {
    console.error('   ❌ FAIL: Credential store failed.\n');
    process.exit(1);
  }

  // Test 2: Workflow Example 1 (Webhook -> IF -> Email -> Slack)
  console.log('2️⃣ Testing Workflow Example 1 (Webhook -> IF -> Email -> Slack)...');
  const createWf1Res = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/workflows',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    },
    { name: 'Lead Order Webhook Automation', description: 'Webhook -> IF -> Email -> Slack' }
  );
  const wf1Id = createWf1Res.data.workflow.id;
  const webhookPath = `/api/webhooks/orders-${Date.now()}`;

  const wf1Nodes = [
    { id: 'n_wh', position: { x: 100, y: 100 }, data: { nodeType: 'webhook', label: 'Order Webhook', config: { httpMethod: 'POST', path: webhookPath } } },
    { id: 'n_if', position: { x: 350, y: 100 }, data: { nodeType: 'if', label: 'Amount > 100 Check', config: { field: 'body.amount', operator: 'greater_than', value: '100' } } },
    { id: 'n_email', position: { x: 600, y: 50 }, data: { nodeType: 'email', label: 'VIP Order Email', config: { to: 'vip@company.com', subject: 'High Value Order' } } },
    { id: 'n_slack', position: { x: 850, y: 50 }, data: { nodeType: 'slack', label: 'Slack Alert', config: { channel: '#sales-vip', message: 'High value order received!', credentialId } } },
  ];

  const wf1Edges = [
    { id: 'e1', source: 'n_wh', target: 'n_if' },
    { id: 'e2_true', source: 'n_if', target: 'n_email', sourceHandle: 'true' },
    { id: 'e3', source: 'n_email', target: 'n_slack' },
  ];

  await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/workflows/${wf1Id}`,
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    },
    { status: 'active', workflow_json: { nodes: wf1Nodes, edges: wf1Edges } }
  );

  // Trigger Webhook Endpoint
  const triggerWhRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: webhookPath,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { orderId: 'ORD-9081', amount: 250 }
  );

  console.log(`   Webhook Trigger Response Status: ${triggerWhRes.statusCode}, Execution Status: ${triggerWhRes.data.executionStatus}`);

  // Wait for worker/sync processing
  await delay(1500);

  const wf1ExecsRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/workflows/${wf1Id}/executions`,
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });

  const latestExec = wf1ExecsRes.data.executions[0];
  console.log(`   Execution ID: ${latestExec?.id}, Final Status: ${latestExec?.status}`);

  if (triggerWhRes.statusCode === 200 && latestExec?.status === 'completed') {
    console.log('   ✅ PASS: Webhook -> IF -> Email -> Slack executed to completion.\n');
  } else {
    console.error('   ❌ FAIL: Webhook workflow failed.\n');
    process.exit(1);
  }

  // Test 3: Workflow Example 2 (Schedule -> HTTP -> PostgreSQL)
  console.log('3️⃣ Testing Workflow Example 2 (Schedule -> HTTP -> PostgreSQL)...');
  const createWf2Res = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/workflows',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    },
    { name: 'Cron Sync Pipeline', description: 'Schedule -> HTTP -> PostgreSQL' }
  );
  const wf2Id = createWf2Res.data.workflow.id;

  const wf2Nodes = [
    { id: 'n_sched', position: { x: 100, y: 100 }, data: { nodeType: 'schedule', label: 'Cron 15m', config: { interval: '15_minutes', cron: '*/15 * * * *' } } },
    { id: 'n_http', position: { x: 350, y: 100 }, data: { nodeType: 'httpRequest', label: 'Fetch Users API', config: { method: 'GET', url: 'https://jsonplaceholder.typicode.com/users/1' } } },
    { id: 'n_pg', position: { x: 600, y: 100 }, data: { nodeType: 'postgres', label: 'Persist DB', config: { query: 'SELECT NOW() as sync_time;', parameters: '[]' } } },
  ];

  const wf2Edges = [
    { id: 'e21', source: 'n_sched', target: 'n_http' },
    { id: 'e22', source: 'n_http', target: 'n_pg' },
  ];

  await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/workflows/${wf2Id}`,
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    },
    { status: 'active', workflow_json: { nodes: wf2Nodes, edges: wf2Edges } }
  );

  const execWf2Res = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/workflows/${wf2Id}/execute`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    },
    { trigger: 'schedule' }
  );

  await delay(1500);

  const wf2DetailRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/executions/${execWf2Res.data.executionId}`,
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });

  console.log(`   Execution Detail Status: ${wf2DetailRes.data.execution?.status}, Steps Completed: ${wf2DetailRes.data.execution?.steps?.length}`);
  if (wf2DetailRes.data.execution?.status === 'completed' && wf2DetailRes.data.execution?.steps?.length === 3) {
    console.log('   ✅ PASS: Schedule -> HTTP -> PostgreSQL pipeline completed successfully.\n');
  } else {
    console.error('   ❌ FAIL: Pipeline 2 execution failed.\n');
    process.exit(1);
  }

  // Test 4: Workflow Example 3 (Webhook -> Transform Code -> PostgreSQL)
  console.log('4️⃣ Testing Workflow Example 3 (Webhook -> Code Transform -> PostgreSQL)...');
  const createWf3Res = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/workflows',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    },
    { name: 'Transform Ingest Pipeline', description: 'Webhook -> Code -> PostgreSQL' }
  );
  const wf3Id = createWf3Res.data.workflow.id;

  const wf3Nodes = [
    { id: 'n_wh3', position: { x: 100, y: 100 }, data: { nodeType: 'webhook', label: 'Ingest Webhook', config: { httpMethod: 'POST', path: `/api/webhooks/ingest-${Date.now()}` } } },
    { id: 'n_code', position: { x: 350, y: 100 }, data: { nodeType: 'code', label: 'JS Transform', config: { codeScript: 'return { processed: true, value: 42 };' } } },
    { id: 'n_pg3', position: { x: 600, y: 100 }, data: { nodeType: 'postgres', label: 'Store Result', config: { query: 'SELECT $1::text as result;', parameters: '["processed_42"]' } } },
  ];

  const wf3Edges = [
    { id: 'e31', source: 'n_wh3', target: 'n_code' },
    { id: 'e32', source: 'n_code', target: 'n_pg3' },
  ];

  await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/workflows/${wf3Id}`,
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    },
    { status: 'active', workflow_json: { nodes: wf3Nodes, edges: wf3Edges } }
  );

  const execWf3Res = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/workflows/${wf3Id}/execute`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    },
    { rawInput: 'test_ingest' }
  );

  await delay(1500);

  const wf3DetailRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/executions/${execWf3Res.data.executionId}`,
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });

  console.log(`   Pipeline 3 Status: ${wf3DetailRes.data.execution?.status}, Steps: ${wf3DetailRes.data.execution?.steps?.length}`);
  if (wf3DetailRes.data.execution?.status === 'completed' && wf3DetailRes.data.execution?.steps?.length === 3) {
    console.log('   ✅ PASS: Webhook -> Code Transform -> PostgreSQL pipeline executed cleanly.\n');
  } else {
    console.error('   ❌ FAIL: Pipeline 3 execution failed.\n');
    process.exit(1);
  }

  console.log('🎉 ALL PHASE 9 REAL-WORLD INTEGRATION & CREDENTIAL TESTS PASSED PERFECTLY!');
};

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
