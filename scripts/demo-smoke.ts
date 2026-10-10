import {
  ApiHealthResponseSchema,
  MockHealthResponseSchema,
  UserSchema,
  InventoryListResponseSchema,
  ShippingEstimateResponseSchema,
  KnownUserIdentities
} from '@driftguard/contracts';

async function runSmokeTests() {
  console.log('Running DriftGuard Demo Smoke Tests...\n');

  // 1. Check API Health
  console.log('1. Checking Control Plane API (http://127.0.0.1:4000/api/health)...');
  const apiRes = await fetch('http://127.0.0.1:4000/api/health');
  if (!apiRes.ok) throw new Error(`API health failed: ${apiRes.status}`);
  const apiData = await apiRes.json();
  ApiHealthResponseSchema.parse(apiData);
  console.log('   ✓ API health verified:', apiData.status);

  // 2. Check Mock Providers Health
  console.log('2. Checking Mock Providers Health (http://127.0.0.1:4001/health)...');
  const mockRes = await fetch('http://127.0.0.1:4001/health');
  if (!mockRes.ok) throw new Error(`Mock health failed: ${mockRes.status}`);
  const mockData = await mockRes.json();
  MockHealthResponseSchema.parse(mockData);
  console.log('   ✓ Mock Providers verified:', mockData.status);

  // 3. Verify Users API across three stable identities
  console.log('3. Checking Users API identities (http://127.0.0.1:4001/users/:id)...');
  for (const identity of KnownUserIdentities) {
    const userRes = await fetch(`http://127.0.0.1:4001/users/${identity.id}`);
    if (!userRes.ok) throw new Error(`Failed to fetch user ${identity.id}`);
    const userData = await userRes.json();
    UserSchema.parse(userData);
    if (userData.name !== identity.name) {
      throw new Error(`Identity mismatch for ${identity.id}: expected ${identity.name}, got ${userData.name}`);
    }
    console.log(`   ✓ User ${identity.id} (${identity.name}) verified`);
  }

  // 4. Verify Inventory API deterministic defaults
  console.log('4. Checking Inventory API (http://127.0.0.1:4001/inventory/items)...');
  const invRes = await fetch('http://127.0.0.1:4001/inventory/items');
  if (!invRes.ok) throw new Error(`Inventory request failed: ${invRes.status}`);
  const invData = await invRes.json();
  InventoryListResponseSchema.parse(invData);
  console.log(`   ✓ Inventory verified: ${invData.items.length} items`);

  // 5. Verify Shipping API calendar day baseline
  console.log('5. Checking Shipping API (http://127.0.0.1:4001/shipping/estimate?ship_date=2026-10-09&delivery_days=3)...');
  const shipRes = await fetch('http://127.0.0.1:4001/shipping/estimate?ship_date=2026-10-09&delivery_days=3');
  if (!shipRes.ok) throw new Error(`Shipping request failed: ${shipRes.status}`);
  const shipData = await shipRes.json();
  ShippingEstimateResponseSchema.parse(shipData);
  if (shipData.estimated_delivery_date !== '2026-10-12') {
    throw new Error(`Expected baseline delivery 2026-10-12, got ${shipData.estimated_delivery_date}`);
  }
  console.log('   ✓ Shipping estimate verified: 2026-10-12 (calendar baseline)');

  console.log('\n===========================================');
  console.log('All Smoke Tests Passed Successfully!');
  console.log('===========================================');
}

runSmokeTests().catch((err) => {
  console.error('\nSmoke test failed:', err);
  process.exit(1);
});
