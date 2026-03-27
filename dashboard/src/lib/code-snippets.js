export const snippets = {
  createSession: {
    title: 'Create Payment Session',
    description: 'Initialize a new payment session',
    method: 'POST',
    path: '/v1/payments/sessions',
    curl: `curl -X POST https://api.taprail.co/v1/payments/sessions \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 5000,
    "merchant_ref": "order_123",
    "metadata": {"customer_id": "cust_456"}
  }'`,
    nodejs: `const response = await fetch('https://api.taprail.co/v1/payments/sessions', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    amount: 5000,
    merchant_ref: 'order_123',
    metadata: { customer_id: 'cust_456' },
  }),
});

const { data: session } = await response.json();
console.log(session.id);`,
    python: `import requests

response = requests.post(
    'https://api.taprail.co/v1/payments/sessions',
    headers={'Authorization': 'Bearer YOUR_API_KEY'},
    json={
        'amount': 5000,
        'merchant_ref': 'order_123',
        'metadata': {'customer_id': 'cust_456'},
    },
)

session = response.json()['data']
print(session['id'])`,
  },
  getSession: {
    title: 'Get Session',
    description: 'Retrieve a payment session by ID',
    method: 'GET',
    path: '/v1/payments/sessions/{id}',
    curl: `curl https://api.taprail.co/v1/payments/sessions/SESSION_ID \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
    nodejs: `const response = await fetch(
  'https://api.taprail.co/v1/payments/sessions/SESSION_ID',
  { headers: { 'Authorization': 'Bearer YOUR_API_KEY' } }
);

const { data: session } = await response.json();`,
    python: `response = requests.get(
    f'https://api.taprail.co/v1/payments/sessions/{session_id}',
    headers={'Authorization': 'Bearer YOUR_API_KEY'},
)

session = response.json()['data']`,
  },
  verifySession: {
    title: 'Verify Session',
    description: 'Verify a session with its nonce and signature',
    method: 'POST',
    path: '/v1/payments/sessions/{id}/verify',
    curl: `curl -X POST https://api.taprail.co/v1/payments/sessions/SESSION_ID/verify \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "nonce": "SESSION_NONCE",
    "signature": "COMPUTED_HMAC_SIGNATURE"
  }'`,
    nodejs: `const response = await fetch(
  'https://api.taprail.co/v1/payments/sessions/SESSION_ID/verify',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      nonce: session.nonce,
      signature: computedSignature,
    }),
  }
);`,
    python: `response = requests.post(
    f'https://api.taprail.co/v1/payments/sessions/{session_id}/verify',
    headers={'Authorization': 'Bearer YOUR_API_KEY'},
    json={
        'nonce': session_nonce,
        'signature': computed_signature,
    },
)`,
  },
  listTransactions: {
    title: 'List Transactions',
    description: 'Retrieve a paginated list of transactions',
    method: 'GET',
    path: '/v1/payments/transactions',
    curl: `curl "https://api.taprail.co/v1/payments/transactions?limit=20&offset=0" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
    nodejs: `const response = await fetch(
  'https://api.taprail.co/v1/payments/transactions?limit=20&offset=0',
  { headers: { 'Authorization': 'Bearer YOUR_API_KEY' } }
);

const { data: transactions } = await response.json();`,
    python: `response = requests.get(
    'https://api.taprail.co/v1/payments/transactions',
    headers={'Authorization': 'Bearer YOUR_API_KEY'},
    params={'limit': 20, 'offset': 0},
)

transactions = response.json()['data']`,
  },
}

export const webhookPayloads = {
  'session.created': {
    event: 'session.created',
    data: {
      id: 'ses_abc123',
      amount: 5000,
      currency: 'NGN',
      status: 'pending',
      merchant_ref: 'order_123',
      created_at: '2026-03-04T12:00:00Z',
      expires_at: '2026-03-04T12:05:00Z',
    },
  },
  'session.paid': {
    event: 'session.paid',
    data: {
      id: 'ses_abc123',
      amount: 5000,
      currency: 'NGN',
      status: 'paid',
      merchant_ref: 'order_123',
    },
  },
  'charge.succeeded': {
    event: 'charge.succeeded',
    data: {
      id: 'txn_def456',
      session_id: 'ses_abc123',
      amount: 5000,
      fee: 75,
      net_amount: 4925,
      currency: 'NGN',
      status: 'success',
      payment_reference: 'PAY-REF-789',
    },
  },
  'charge.failed': {
    event: 'charge.failed',
    data: {
      id: 'txn_ghi789',
      session_id: 'ses_abc123',
      amount: 5000,
      currency: 'NGN',
      status: 'failed',
      error: 'Insufficient funds',
    },
  },
}
