// Netlify serverless function — creates a Google Calendar event on booking
const { createSign } = require('crypto');

const TIME_SLOT_END = { 8: 12, 12: 15, 15: 18 };

function createJWT(email, privateKey) {
  const now = Math.floor(Date.now() / 1000);
  const header  = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const claims  = Buffer.from(JSON.stringify({
    iss:   email,
    scope: 'https://www.googleapis.com/auth/calendar',
    aud:   'https://oauth2.googleapis.com/token',
    iat:   now,
    exp:   now + 3600,
  })).toString('base64url');
  const unsigned = `${header}.${claims}`;
  const signer = createSign('RSA-SHA256');
  signer.update(unsigned);
  return `${unsigned}.${signer.sign(privateKey, 'base64url')}`;
}

async function getAccessToken(email, privateKey) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: createJWT(email, privateKey),
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('Token exchange failed: ' + JSON.stringify(data));
  return data.access_token;
}

function toDateTime(dateStr, hour) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const pad = n => String(n).padStart(2, '0');
  return `${y}-${pad(m)}-${pad(d)}T${pad(hour)}:00:00`;
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { body = {}; }

  const { customerName, customerPhone, customerCar, customerAddress,
          date, timeHour, timeName, addons, finalPrice } = body;

  if (!customerName || !customerPhone || !date || timeHour == null) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
  }

  const serviceEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey   = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  const calendarId   = process.env.GOOGLE_CALENDAR_ID;

  if (!serviceEmail || !privateKey || !calendarId) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Calendar credentials not configured' }) };
  }

  try {
    const token = await getAccessToken(serviceEmail, privateKey);

    const startHour = parseInt(timeHour, 10);
    const endHour   = TIME_SLOT_END[startHour] || startHour + 2;

    const event = {
      summary: `BMS Detail — ${customerName}`,
      description: [
        `טלפון: ${customerPhone}`,
        `רכב: ${customerCar || 'לא צוין'}`,
        `כתובת: ${customerAddress}`,
        `שעה: ${timeName}`,
        '',
        addons,
        '',
        `סה״כ: ₪${finalPrice}`,
      ].join('\n'),
      start: { dateTime: toDateTime(date, startHour), timeZone: 'Asia/Jerusalem' },
      end:   { dateTime: toDateTime(date, endHour),   timeZone: 'Asia/Jerusalem' },
    };

    const calRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify(event),
      }
    );

    const calData = await calRes.json();
    if (!calRes.ok) {
      console.error('Calendar API error:', calData);
      return { statusCode: 500, body: JSON.stringify({ error: 'Calendar event creation failed', details: calData }) };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId: calData.id }),
    };
  } catch (err) {
    console.error('book function error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
