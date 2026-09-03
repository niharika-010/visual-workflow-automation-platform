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
  console.log('🧪 Starting Phase 2 Authentication Integration Tests...\n');

  const testUser = {
    name: 'Sarah Connor',
    email: `sarah_${Date.now()}@sky.net`,
    password: 'SecurePassword123!',
  };

  let authToken = '';

  // Test 1: User Registration
  console.log('1️⃣ Testing POST /api/auth/register...');
  const regRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    testUser
  );
  console.log(`   Status: ${regRes.statusCode}`);
  console.log(`   Response:`, regRes.data);
  if (regRes.statusCode === 201 && regRes.data.token && !regRes.data.user.password_hash) {
    console.log('   ✅ PASS: Registration returned token and user without password hash.\n');
  } else {
    console.error('   ❌ FAIL: Registration failed.\n');
    process.exit(1);
  }

  // Test 2: Duplicate Registration Prevention
  console.log('2️⃣ Testing Duplicate Registration Prevention...');
  const dupRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    testUser
  );
  console.log(`   Status: ${dupRes.statusCode}`);
  console.log(`   Response:`, dupRes.data);
  if (dupRes.statusCode === 400 && dupRes.data.status === 'error') {
    console.log('   ✅ PASS: Duplicate registration rejected cleanly.\n');
  } else {
    console.error('   ❌ FAIL: Duplicate registration check failed.\n');
    process.exit(1);
  }

  // Test 3: Invalid Login
  console.log('3️⃣ Testing Invalid Password Login...');
  const invRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: testUser.email, password: 'WrongPassword999' }
  );
  console.log(`   Status: ${invRes.statusCode}`);
  console.log(`   Response:`, invRes.data);
  if (invRes.statusCode === 401) {
    console.log('   ✅ PASS: Invalid login rejected with 401 Unauthorized.\n');
  } else {
    console.error('   ❌ FAIL: Invalid login check failed.\n');
    process.exit(1);
  }

  // Test 4: Successful Login
  console.log('4️⃣ Testing Successful Login...');
  const loginRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: testUser.email, password: testUser.password }
  );
  console.log(`   Status: ${loginRes.statusCode}`);
  console.log(`   Response:`, loginRes.data);
  if (loginRes.statusCode === 200 && loginRes.data.token) {
    authToken = loginRes.data.token;
    console.log('   ✅ PASS: Login returned valid JWT token.\n');
  } else {
    console.error('   ❌ FAIL: Valid login failed.\n');
    process.exit(1);
  }

  // Test 5: Unauthenticated Access to Protected Route
  console.log('5️⃣ Testing Unauthenticated Request to GET /api/auth/me...');
  const unauthRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/me',
    method: 'GET',
  });
  console.log(`   Status: ${unauthRes.statusCode}`);
  console.log(`   Response:`, unauthRes.data);
  if (unauthRes.statusCode === 401) {
    console.log('   ✅ PASS: Unauthenticated request rejected with 401 Unauthorized.\n');
  } else {
    console.error('   ❌ FAIL: Unauthenticated route check failed.\n');
    process.exit(1);
  }

  // Test 6: Authenticated Access to Protected Route
  console.log('6️⃣ Testing Authenticated Request to GET /api/auth/me with Bearer Token...');
  const authRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/me',
    method: 'GET',
    headers: { Authorization: `Bearer ${authToken}` },
  });
  console.log(`   Status: ${authRes.statusCode}`);
  console.log(`   Response:`, authRes.data);
  if (authRes.statusCode === 200 && authRes.data.user && authRes.data.user.email === testUser.email) {
    console.log('   ✅ PASS: Protected endpoint returned authenticated user profile.\n');
  } else {
    console.error('   ❌ FAIL: Protected route with Bearer token failed.\n');
    process.exit(1);
  }

  console.log('🎉 ALL PHASE 2 AUTHENTICATION INTEGRATION TESTS PASSED PERFECTLY!');
};

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
