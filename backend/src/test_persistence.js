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
  console.log('🧪 Starting Phase 6 Persistence, JSON Validation & Versioning Integration Tests...\n');

  // Register & Login User
  const user = {
    name: 'Version Auditor',
    email: `auditor_${Date.now()}@example.com`,
    password: 'Password123!',
  };

  const regRes = await makeRequest(
    { hostname: 'localhost', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    user
  );
  const token = regRes.data.token;
  console.log(`✅ User Registered (${user.email})\n`);

  // Create Base Workflow
  const createRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/workflows',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    },
    { name: 'Schema & Version Test Flow', description: 'Testing validation & versioning' }
  );
  const workflowId = createRes.data.workflow.id;
  console.log(`✅ Workflow Created (ID: ${workflowId})\n`);

  // Test 1: Malformed Workflow JSON Rejection
  console.log('1️⃣ Testing Validation: Rejecting Invalid Nodes List...');
  const badNodeRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/workflows/${workflowId}`,
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    },
    { workflow_json: { nodes: 'not_an_array', edges: [] } }
  );
  console.log(`   Status: ${badNodeRes.statusCode}, Error: ${badNodeRes.data.message}`);
  if (badNodeRes.statusCode === 400) {
    console.log('   ✅ PASS: Invalid nodes array rejected with 400 Bad Request.\n');
  } else {
    console.error('   ❌ FAIL: Malformed JSON validation failed.\n');
    process.exit(1);
  }

  // Test 2: Dangling Edge Reference Rejection
  console.log('2️⃣ Testing Validation: Rejecting Dangling Edge Reference...');
  const badEdgeRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/workflows/${workflowId}`,
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    },
    {
      workflow_json: {
        nodes: [{ id: 'node_1', position: { x: 100, y: 100 }, data: { label: 'Node 1' } }],
        edges: [{ id: 'edge_1', source: 'node_1', target: 'non_existent_node_999' }],
      },
    }
  );
  console.log(`   Status: ${badEdgeRes.statusCode}, Error: ${badEdgeRes.data.message}`);
  if (badEdgeRes.statusCode === 400 && badEdgeRes.data.message.includes('non_existent_node_999')) {
    console.log('   ✅ PASS: Dangling edge reference rejected cleanly.\n');
  } else {
    console.error('   ❌ FAIL: Dangling edge check failed.\n');
    process.exit(1);
  }

  // Test 3: Valid Save (Version 1 -> Version 2)
  console.log('3️⃣ Testing Valid Save & Version Snapshot Creation...');
  const v1Payload = {
    nodes: [
      { id: 'node_1', position: { x: 100, y: 100 }, data: { nodeType: 'webhook', config: { path: '/v1/hook' } } },
      { id: 'node_2', position: { x: 400, y: 100 }, data: { nodeType: 'email', config: { to: 'a@b.com' } } },
    ],
    edges: [{ id: 'edge_1', source: 'node_1', target: 'node_2' }],
  };
  const saveV1Res = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/workflows/${workflowId}`,
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    },
    { workflow_json: v1Payload }
  );
  console.log(`   Save V1 Status: ${saveV1Res.statusCode}, Current Version: ${saveV1Res.data.workflow?.version}`);

  const v2Payload = {
    nodes: [
      ...v1Payload.nodes,
      { id: 'node_3', position: { x: 700, y: 100 }, data: { nodeType: 'slack', config: { channel: '#logs' } } },
    ],
    edges: [...v1Payload.edges, { id: 'edge_2', source: 'node_2', target: 'node_3' }],
  };
  const saveV2Res = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/workflows/${workflowId}`,
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    },
    { workflow_json: v2Payload }
  );
  console.log(`   Save V2 Status: ${saveV2Res.statusCode}, Current Version: ${saveV2Res.data.workflow?.version}`);

  if (saveV1Res.data.workflow?.version === 2 && saveV2Res.data.workflow?.version === 3) {
    console.log('   ✅ PASS: Version history snapshot entries created.\n');
  } else {
    console.error('   ❌ FAIL: Version snapshot creation failed.\n');
    process.exit(1);
  }

  // Test 4: Fetch Version History List
  console.log('4️⃣ Testing GET /api/workflows/:id/versions...');
  const versionsRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/workflows/${workflowId}/versions`,
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log(`   Status: ${versionsRes.statusCode}, Total Versions Found: ${versionsRes.data.count}`);
  if (versionsRes.statusCode === 200 && versionsRes.data.versions?.length >= 3) {
    console.log('   ✅ PASS: Retrived full version history timeline.\n');
  } else {
    console.error('   ❌ FAIL: Fetch version history failed.\n');
    process.exit(1);
  }

  // Test 5: Restore Version
  console.log('5️⃣ Testing Version Restoration (Restoring Version 2)...');
  const targetVersion = versionsRes.data.versions.find((v) => v.version === 2);
  const restoreRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/workflows/${workflowId}/versions/${targetVersion.id}/restore`,
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log(`   Restore Status: ${restoreRes.statusCode}, New Active Version: ${restoreRes.data.workflow?.version}`);
  const restoredJson = typeof restoreRes.data.workflow?.workflow_json === 'string'
    ? JSON.parse(restoreRes.data.workflow.workflow_json)
    : restoreRes.data.workflow?.workflow_json;

  if (restoreRes.statusCode === 200 && restoredJson.nodes.length === 2) {
    console.log('   ✅ PASS: Version 2 payload successfully restored as new active version snapshot.\n');
  } else {
    console.error('   ❌ FAIL: Restore version failed.\n');
    process.exit(1);
  }

  console.log('🎉 ALL PHASE 6 PERSISTENCE & VERSIONING INTEGRATION TESTS PASSED PERFECTLY!');
};

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
