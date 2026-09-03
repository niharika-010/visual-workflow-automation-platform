import { execSync } from 'child_process';

const runCommand = (cmd, label) => {
  console.log(`====================================================`);
  console.log(`🏃 Running Test Suite: ${label}`);
  console.log(`====================================================`);
  try {
    const output = execSync(cmd, { cwd: process.cwd(), encoding: 'utf-8' });
    console.log(output);
    console.log(`✅ [${label}] PASSED PERFECTLY!\n`);
    return true;
  } catch (err) {
    console.error(err.stdout || err.message);
    console.error(`❌ [${label}] FAILED!\n`);
    return false;
  }
};

const runMasterSuite = async () => {
  console.log('\n🏆 VISUAL WORKFLOW AUTOMATION PLATFORM MASTER TEST SUITE 🏆\n');

  const results = [
    { name: 'Phase 2: User Authentication & JWT Security', pass: runCommand('node src/test_auth.js', 'Auth & Security') },
    { name: 'Phase 3: Workflows CRUD & Ownership Isolation', pass: runCommand('node src/test_workflows.js', 'Workflow CRUD') },
    { name: 'Phase 6: Persistence, Schema Validation & Versioning', pass: runCommand('node src/test_persistence.js', 'Schema & Versioning') },
    { name: 'Phase 7: Core Graph Execution Engine & IF Logic', pass: runCommand('node src/test_execution.js', 'Execution Engine') },
    { name: 'Phase 8: BullMQ Worker Background Queue', pass: runCommand('node src/test_bullmq.js', 'BullMQ Worker Queue') },
    { name: 'Phase 9: Real-World Integrations & Credential Store', pass: runCommand('node src/test_integrations.js', 'Integrations & Credentials') },
  ];

  console.log('\n====================================================');
  console.log('📊 MASTER TEST SUITE RESULTS SCORECARD');
  console.log('====================================================');

  let passedCount = 0;
  results.forEach((r) => {
    if (r.pass) passedCount++;
    console.log(`${r.pass ? '✅ PASS' : '❌ FAIL'} | ${r.name}`);
  });

  console.log('====================================================');
  console.log(`RESULT: ${passedCount}/${results.length} Test Suites Passed (${Math.round((passedCount / results.length) * 100)}% Success Rate)\n`);

  if (passedCount < results.length) {
    process.exit(1);
  }
};

runMasterSuite();
