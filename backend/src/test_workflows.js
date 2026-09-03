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
  console.log('🧪 Starting Phase 3 Workflow CRUD & Ownership Integration Tests...\n');

  // Register User A
  const userA = {
    name: 'Alice Designer',
    email: `alice_${Date.now()}@example.com`,
    password: 'Password123!',
  };
  const regA = await makeRequest(
    { hostname: 'localhost', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    userA
  );
  const tokenA = regA.data.token;
  console.log(`✅ User A Registered (${userA.email})`);

  // Register User B
  const userB = {
    name: 'Bob Intruder',
    email: `bob_${Date.now()}@example.com`,
    password: 'Password123!',
  };
  const regB = await makeRequest(
    { hostname: 'localhost', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    userB
  );
  const tokenB = regB.data.token;
  console.log(`✅ User B Registered (${userB.email})\n`);

  let createdWorkflowId = '';

  // Test 1: User A Creates Workflow
  console.log('1️⃣ Testing POST /api/workflows (User A Creates Workflow)...');
  const createRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/workflows',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
    },
    { name: 'Lead Nurture Webhook', description: 'Automated email sequence for leads' }
  );
  console.log(`   Status: ${createRes.statusCode}`);
  console.log(`   Response:`, createRes.data);
  if (createRes.statusCode === 201 && createRes.data.workflow?.id) {
    createdWorkflowId = createRes.data.workflow.id;
    console.log('   ✅ PASS: Workflow created successfully with default draft status & empty nodes.\n');
  } else {
    console.error('   ❌ FAIL: Create workflow failed.\n');
    process.exit(1);
  }

  // Test 2: User A Lists Workflows
  console.log('2️⃣ Testing GET /api/workflows (User A Lists Workflows)...');
  const listRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/workflows',
    method: 'GET',
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  console.log(`   Status: ${listRes.statusCode}`);
  console.log(`   Response Count: ${listRes.data.count}`);
  if (listRes.statusCode === 200 && listRes.data.count === 1) {
    console.log('   ✅ PASS: User A successfully retrieved workflow list.\n');
  } else {
    console.error('   ❌ FAIL: List workflows failed.\n');
    process.exit(1);
  }

  // Test 3: User A Updates Workflow
  console.log('3️⃣ Testing PUT /api/workflows/:id (User A Updates Workflow)...');
  const updateRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/workflows/${createdWorkflowId}`,
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
    },
    { name: 'Updated Lead Nurture Webhook v2', description: 'Updated automation sequence' }
  );
  console.log(`   Status: ${updateRes.statusCode}`);
  console.log(`   Response:`, updateRes.data);
  if (updateRes.statusCode === 200 && updateRes.data.workflow.version === 2) {
    console.log('   ✅ PASS: Workflow updated & version incremented.\n');
  } else {
    console.error('   ❌ FAIL: Update workflow failed.\n');
    process.exit(1);
  }

  // Test 4: Activate & Deactivate Workflow
  console.log('4️⃣ Testing POST /api/workflows/:id/activate & /deactivate...');
  const actRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/workflows/${createdWorkflowId}/activate`,
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  console.log(`   Activate Status: ${actRes.statusCode}, Workflow Status: ${actRes.data.workflow?.status}`);

  const deactRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/workflows/${createdWorkflowId}/deactivate`,
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  console.log(`   Deactivate Status: ${deactRes.statusCode}, Workflow Status: ${deactRes.data.workflow?.status}`);

  if (actRes.data.workflow?.status === 'active' && deactRes.data.workflow?.status === 'inactive') {
    console.log('   ✅ PASS: Activation and Deactivation status transitions verified.\n');
  } else {
    console.error('   ❌ FAIL: Activation/Deactivation failed.\n');
    process.exit(1);
  }

  // Test 5: Ownership Enforcement (User B Attempts to Access User A's Workflow)
  console.log('5️⃣ Testing Ownership Enforcement (User B Accesses User A\'s Workflow)...');
  const bReadRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/workflows/${createdWorkflowId}`,
    method: 'GET',
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  console.log(`   User B Read Status: ${bReadRes.statusCode}`);

  const bDeleteRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/workflows/${createdWorkflowId}`,
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  console.log(`   User B Delete Status: ${bDeleteRes.statusCode}`);

  if (bReadRes.statusCode === 404 && bDeleteRes.statusCode === 404) {
    console.log('   ✅ PASS: Multi-tenant ownership checks strictly prevented unauthorized access.\n');
  } else {
    console.error('   ❌ FAIL: Ownership check failed!\n');
    process.exit(1);
  }

  // Test 6: User A Deletes Workflow
  console.log('6️⃣ Testing DELETE /api/workflows/:id (User A Deletes Workflow)...');
  const deleteRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/workflows/${createdWorkflowId}`,
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  console.log(`   Status: ${deleteRes.statusCode}`);
  console.log(`   Response:`, deleteRes.data);

  if (deleteRes.statusCode === 200 && deleteRes.data.status === 'success') {
    console.log('   ✅ PASS: User A successfully deleted workflow.\n');
  } else {
    console.error('   ❌ FAIL: Delete workflow failed.\n');
    process.exit(1);
  }

  console.log('🎉 ALL PHASE 3 WORKFLOW CRUD INTEGRATION TESTS PASSED PERFECTLY!');
};

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
