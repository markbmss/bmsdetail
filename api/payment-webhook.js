// Vercel serverless function — handles Grow (Meshulam) payment webhook
// Called by Grow after the customer completes payment
// MUST call approveTransaction — without it the payment is not finalized

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const { transactionCode } = req.body;

  if (!transactionCode) {
    console.error('Webhook received without transactionCode');
    return res.status(400).json({ error: 'Missing transactionCode' });
  }

  const isSandbox = process.env.GROW_SANDBOX === 'true';
  const apiBase = isSandbox
    ? 'https://sandbox.meshulam.co.il'
    : 'https://api.meshulam.co.il';

  // Approve the transaction — this step is mandatory
  const formData = new FormData();
  formData.append('pageCode', process.env.GROW_PAGE_CODE);
  formData.append('userId', process.env.GROW_USER_ID);
  formData.append('transactionCode', transactionCode);

  try {
    const response = await fetch(
      `${apiBase}/api/light/server/1.0/approveTransaction`,
      { method: 'POST', body: formData }
    );

    const data = await response.json();

    if (data.status !== 1) {
      console.error('approveTransaction failed:', data);
      return res.status(500).json({ error: 'Approval failed', details: data });
    }

    console.log('Payment approved, transactionCode:', transactionCode);
    return res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error('approveTransaction request failed:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
