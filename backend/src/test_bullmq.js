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
  console.log('🧪 Starting Phase 8 BullMQ Queue & Worker Execution Integration Tests...\n');

  // Register & Login User
  const user = {
    name: 'BullMQ Auditor',
    email: `bullmq_${Date.now()}@example.com`,
    password: 'Password123!',
  };

  const regRes = await makeRequest(
    { hostname: 'localhost', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    user
  );
  const token = regRes.data.token;
  console.log(`✅ User Registered (${user.email})\n`);

  // Create Workflow Graph
  const createRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/workflows',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    },
    { name: 'BullMQ Async Queue Test Flow', description: 'Testing non-blocking background queue execution' }
  );
  const workflowId = createRes.data.workflow.id;

  const canvasNodes = [
    { id: 'n_start', position: { x: 100, y: 100 }, data: { nodeType: 'manual', label: 'Manual Trigger' } },
    { id: 'n_http', position: { x: 350, y: 100 }, data: { nodeType: 'httpRequest', label: 'Fetch Todo', config: { method: 'GET', url: 'https://jsonplaceholder.typicode.com/todos/2' } } },
  ];

  const canvasEdges = [
    { id: 'e_1', source: 'n_start', target: 'n_http' },
  ];

  await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/workflows/${workflowId}`,
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    },
    { workflow_json: { nodes: canvasNodes, edges: canvasEdges } }
  );

  console.log(`✅ Workflow Created (ID: ${workflowId})\n`);

  // Test 1: Non-blocking Async Dispatch Trigger
  console.log('1️⃣ Testing Async Execution Dispatch (POST /api/workflows/:id/execute)...');
  const execRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/workflows/${workflowId}/execute`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    },
    { testKey: 'async_payload_1' }
  );

  console.log(`   API Status: ${execRes.statusCode}, Enqueued Execution Status: ${execRes.data.executionStatus}`);
  console.log(`   Execution ID: ${execRes.data.executionId}`);

  if (execRes.statusCode === 200 && ['queued', 'completed'].includes(execRes.data.executionStatus)) {
    console.log('   ✅ PASS: Execution request enqueued immediately.\n');
  } else {
    console.error('   ❌ FAIL: Execution dispatch failed.\n');
    process.exit(1);
  }

  // Test 2: Poll Execution Record Status in Database
  console.log('2️⃣ Testing Execution Status Polling (GET /api/executions/:executionId)...');
  let finalStatus = 'queued';
  let attempts = 0;
  let detailRes = null;

  while (attempts < 10 && finalStatus !== 'completed' && finalStatus !== 'failed') {
    await delay(1000);
    attempts++;
    detailRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/executions/${execRes.data.executionId}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    finalStatus = detailRes.data.execution?.status;
    console.log(`   Poll #${attempts}: Current Execution Status = "${finalStatus}"`);
  }

  if (detailRes.statusCode === 200 && finalStatus === 'completed') {
    const stepsCount = detailRes.data.execution?.steps?.length || 0;
    console.log(`   Total Execution Steps Completed: ${stepsCount}`);
    console.log('   ✅ PASS: Background worker successfully processed queued job to completion.\n');
  } else {
    console.error(`   ❌ FAIL: Execution polling timed out or failed with status "${finalStatus}".\n`);
    process.exit(1);
  }

  console.log('🎉 ALL PHASE 8 BULLMQ & WORKER EXECUTION TESTS PASSED PERFECTLY!');
};

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
