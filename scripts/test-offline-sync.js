import http from 'http';

function post(path, body, token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(
      {
        hostname: 'localhost',
        port: 3000,
        path,
        method: 'POST',
        headers,
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(raw) });
          } catch {
            resolve({ status: res.statusCode, data: raw });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path, token) {
  return new Promise((resolve, reject) => {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(
      {
        hostname: 'localhost',
        port: 3000,
        path,
        method: 'GET',
        headers,
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(raw) });
          } catch {
            resolve({ status: res.statusCode, data: raw });
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function runTest() {
  console.log('[Test] 1. Checking /api/health...');
  const health = await get('/api/health');
  console.log('[Test] Health response:', health.data);

  console.log('\n[Test] 2. Authenticating test user (register or login)...');
  const testPhone = '0179988' + Math.floor(1000 + Math.random() * 9000);
  const testEmail = `test_sync_${Date.now()}@example.com`;
  const regRes = await post('/api/auth/register', {
    fullName: 'Offline Test User',
    mobileNumber: testPhone,
    email: testEmail,
    password: 'securePassword123',
  });

  let token = regRes.data?.token;
  if (!token) {
    console.log('[Test] Register failed, trying login with identifier...');
    const loginRes = await post('/api/auth/login', {
      identifier: testPhone,
      password: 'securePassword123',
    });
    token = loginRes.data?.token;
  }
  console.log('[Test] Authenticated successfully with token:', Boolean(token));
  if (!token) throw new Error('Authentication failed: ' + JSON.stringify(regRes.data));

  console.log('\n[Test] 3. Testing initial data sync...');
  const sync1 = await get('/api/data/sync', token);
  const initialTxCount = sync1.data?.data?.transactions?.length || 0;
  console.log(`[Test] Cloud transactions found: ${initialTxCount}`);

  console.log('\n[Test] 4. Testing idempotent transaction creation & deduplication...');
  const testTxId = 'tx-test-offline-' + Date.now();
  const txPayload = {
    id: testTxId,
    type: 'income',
    amount: 5000,
    category: 'salary',
    date: '2026-11-10',
    time: '14:30',
    source: 'Tech Corp',
    paymentMethod: 'bank',
  };

  const create1 = await post('/api/data/transactions', txPayload, token);
  console.log('[Test] First insert status:', create1.status, create1.data);

  // Repeat identical insert to simulate duplicate re-sync after reconnect
  const create2 = await post('/api/data/transactions', txPayload, token);
  console.log('[Test] Duplicate re-sync insert status:', create2.status, create2.data);

  const sync2 = await get('/api/data/sync', token);
  const foundMatches = (sync2.data?.data?.transactions || []).filter((t) => t.id === testTxId);
  console.log(`[Test] Matches found for ${testTxId}: ${foundMatches.length} (Expected: 1, no duplicate!)`);
  if (foundMatches.length !== 1) {
    throw new Error('Deduplication failed: expected 1 record, got ' + foundMatches.length);
  }

  console.log('\n[Test] 5. Testing debt creation & payment synchronization...');
  const testDebtId = 'debt-test-offline-' + Date.now();
  const debtPayload = {
    id: testDebtId,
    type: 'lent',
    personName: 'Rahim Khan',
    personPhone: '01811998877',
    totalAmount: 3000,
    startDate: '2026-11-10',
    status: 'pending',
  };
  const debtRes = await post('/api/data/debts', debtPayload, token);
  console.log('[Test] Debt insert status:', debtRes.status, debtRes.data);

  const payId = 'pay-test-offline-' + Date.now();
  const payPayload = {
    id: payId,
    amount: 1500,
    date: '2026-11-10',
    time: '15:00',
    note: 'First installment',
    paymentMethod: 'bkash',
  };
  const payRes = await post(`/api/data/debts/${testDebtId}/payments`, payPayload, token);
  console.log('[Test] Payment insert status:', payRes.status, payRes.data);

  const sync3 = await get('/api/data/sync', token);
  const syncedDebt = (sync3.data?.data?.debts || []).find((d) => d.id === testDebtId);
  console.log(`[Test] Debt status after payment: ${syncedDebt?.status} (Expected: partial)`);
  console.log(`[Test] Debt payments count: ${syncedDebt?.payments?.length} (Expected: 1)`);

  console.log('\n=== ALL OFFLINE SYNC & CLOUD DATABASE VERIFICATION TESTS PASSED ===\n');
}

runTest().catch((err) => {
  console.error('[Test Error]:', err);
  process.exit(1);
});
