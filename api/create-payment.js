// Vercel serverless function — creates a Grow (Meshulam) payment page
// All Grow API calls MUST use multipart/form-data, never JSON

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    customerName,
    customerPhone,
    carType,
    address,
    preferredDate,
    orderSummary,
    totalPrice,
  } = req.body;

  if (!customerName || !customerPhone) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const isSandbox = process.env.GROW_SANDBOX === 'true';
  const apiBase = isSandbox
    ? 'https://sandbox.meshulam.co.il'
    : 'https://api.meshulam.co.il';

  const formData = new FormData();
  formData.append('pageCode', process.env.GROW_PAGE_CODE);
  formData.append('userId', process.env.GROW_USER_ID);
  formData.append('sum', '50');
  formData.append('pageField[fullName]', customerName);
  formData.append('pageField[phone]', customerPhone);
  formData.append(
    'description',
    `BMS Detail Deposit — ${orderSummary} (Total: ₪${totalPrice}) | Car: ${carType} | Address: ${address} | Date: ${preferredDate}`
  );
  formData.append('successUrl', 'https://bmsdetail.com/thank-you.html');
  formData.append('cancelUrl', 'https://bmsdetail.com/#cars');
  formData.append('notifyUrl', 'https://bmsdetail.com/api/payment-webhook');

  try {
    const response = await fetch(
      `${apiBase}/api/light/server/1.0/createPaymentProcess`,
      { method: 'POST', body: formData }
    );

    const data = await response.json();

    if (data.status === 1 && data.data?.url) {
      return res.status(200).json({ paymentUrl: data.data.url });
    }

    console.error('Grow API error:', data);
    return res.status(400).json({ error: 'Payment creation failed', details: data });
  } catch (err) {
    console.error('Grow API request failed:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
