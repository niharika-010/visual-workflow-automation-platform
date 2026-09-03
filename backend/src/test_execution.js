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

const runTests = async () => {
  console.log('🧪 Starting Phase 7 Core Workflow Execution Engine Integration Tests...\n');

  // Register & Login User
  const user = {
    name: 'Engine Tester',
    email: `executor_${Date.now()}@example.com`,
    password: 'Password123!',
  };

  const regRes = await makeRequest(
    { hostname: 'localhost', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    user
  );
  const token = regRes.data.token;
  console.log(`✅ User Registered (${user.email})\n`);

  // Create Workflow Graph: Manual Trigger -> HTTP Request -> IF -> Delay
  const createRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/workflows',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    },
    { name: 'Execution Pipeline Workflow', description: 'Manual -> HTTP -> IF -> Delay' }
  );
  const workflowId = createRes.data.workflow.id;

  const canvasNodes = [
    { id: 'node_manual', position: { x: 100, y: 100 }, data: { nodeType: 'manual', label: 'Manual Start', config: { notes: 'Automated test' } } },
    {
      id: 'node_http',
      position: { x: 350, y: 100 },
      data: {
        nodeType: 'httpRequest',
        label: 'Fetch Todo API',
        config: { method: 'GET', url: 'https://jsonplaceholder.typicode.com/todos/1' },
      },
    },
    {
      id: 'node_if',
      position: { x: 600, y: 100 },
      data: {
        nodeType: 'if',
        label: 'Check Completed',
        config: { field: 'completed', operator: 'equals', value: 'false' },
      },
    },
    {
      id: 'node_delay_true',
      position: { x: 850, y: 50 },
      data: {
        nodeType: 'delay',
        label: 'Delay True Path',
        config: { duration: '1', unit: 'seconds' },
      },
    },
    {
      id: 'node_email_false',
      position: { x: 850, y: 200 },
      data: {
        nodeType: 'email',
        label: 'Email False Path',
        config: { to: 'alert@example.com', subject: 'Already Completed' },
      },
    },
  ];

  const canvasEdges = [
    { id: 'edge_1', source: 'node_manual', target: 'node_http' },
    { id: 'edge_2', source: 'node_http', target: 'node_if' },
    { id: 'edge_3_true', source: 'node_if', target: 'node_delay_true', sourceHandle: 'true' },
    { id: 'edge_4_false', source: 'node_if', target: 'node_email_false', sourceHandle: 'false' },
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

  console.log(`✅ Workflow Graph Constructed (ID: ${workflowId})\n`);

  // Test 1: Execute Workflow
  console.log('1️⃣ Testing Synchronous Execution (POST /api/workflows/:id/execute)...');
  const execRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/workflows/${workflowId}/execute`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    },
    { sampleInput: 'test_payload_123' }
  );

  console.log(`   Execution Status: ${execRes.statusCode}, Result Status: ${execRes.data.executionStatus}`);
  console.log(`   Execution ID: ${execRes.data.executionId}`);

  if (execRes.statusCode === 200 && execRes.data.executionStatus === 'completed') {
    const outputs = execRes.data.outputs || {};
    console.log(`   Nodes Executed Sequence: ${Object.keys(outputs).join(' -> ')}`);
    console.log(`   HTTP Status Code Received: ${outputs.node_http?.status || outputs.node_http?.data?.status}`);
    console.log(`   IF Evaluated Actual Value: ${outputs.node_if?.actualValue || outputs.node_if?.data?.actualValue}`);
    console.log(`   IF Node Selected Branch: ${outputs.node_if?.selectedBranch || outputs.node_if?.data?.selectedBranch}`);

    if (outputs.node_manual && outputs.node_http && outputs.node_if && outputs.node_delay_true && !outputs.node_email_false) {
      console.log('   ✅ PASS: Execution engine followed topological order & IF true branch correctly.\n');
    } else {
      console.error('   ❌ FAIL: Node branching or traversal error.\n');
      process.exit(1);
    }
  } else {
    console.error('   ❌ FAIL: Execution failed.\n');
    process.exit(1);
  }

  // Test 2: Verify Execution Logs in Database
  console.log('2️⃣ Testing Execution History (GET /api/workflows/:id/executions)...');
  const historyRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/workflows/${workflowId}/executions`,
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });

  console.log(`   Status: ${historyRes.statusCode}, Total Executions: ${historyRes.data.count}`);
  if (historyRes.statusCode === 200 && historyRes.data.executions.length >= 1) {
    console.log('   ✅ PASS: Execution run record saved in database.\n');
  } else {
    console.error('   ❌ FAIL: History endpoint returned empty.\n');
    process.exit(1);
  }

  // Test 3: Verify Step Logs Detail
  console.log('3️⃣ Testing Execution Detail & Step Logs (GET /api/executions/:executionId)...');
  const detailRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/executions/${execRes.data.executionId}`,
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });

  console.log(`   Status: ${detailRes.statusCode}, Step Logs Recorded: ${detailRes.data.execution?.steps?.length || 0}`);
  if (detailRes.statusCode === 200 && (detailRes.data.execution?.steps?.length || 0) >= 4) {
    console.log('   ✅ PASS: Step-by-step logs recorded for every node execution.\n');
  } else {
    console.error('   ❌ FAIL: Step logs missing.\n');
    process.exit(1);
  }

  console.log('🎉 ALL PHASE 7 WORKFLOW EXECUTION ENGINE TESTS PASSED PERFECTLY!');
};

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
