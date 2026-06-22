// Netlify serverless function — returns booked time slots from Google Calendar
const { createSign } = require('crypto');

const SLOTS = [
  { hour: 8,  end: 12 },
  { hour: 12, end: 15 },
  { hour: 15, end: 18 },
];

function createJWT(email, privateKey) {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const claims = Buffer.from(JSON.stringify({
    iss:   email,
    scope: 'https://www.googleapis.com/auth/calendar.readonly',
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

// Returns hour (8, 12, or 15) of a dateTime string in Asia/Jerusalem time
function getLocalHour(dateTimeStr) {
  const d = new Date(dateTimeStr);
  return parseInt(
    d.toLocaleString('en-US', { timeZone: 'Asia/Jerusalem', hour: 'numeric', hour12: false }),
    10
  );
}

// Returns YYYY-MM-DD of a dateTime string in Asia/Jerusalem time
function getLocalDate(dateTimeStr) {
  const d = new Date(dateTimeStr);
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' }); // en-CA gives YYYY-MM-DD
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const params = event.queryStringParameters || {};
  const from = params.from; // YYYY-MM-DD
  const to   = params.to;   // YYYY-MM-DD

  if (!from || !to) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing from/to params' }) };
  }

  const serviceEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey   = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  const calendarId   = process.env.GOOGLE_CALENDAR_ID;

  if (!serviceEmail || !privateKey || !calendarId) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Calendar credentials not configured' }) };
  }

  try {
    const token = await getAccessToken(serviceEmail, privateKey);

    const timeMin = encodeURIComponent(from + 'T00:00:00+03:00');
    const timeMax = encodeURIComponent(to   + 'T23:59:59+03:00');

    const calRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events` +
      `?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&maxResults=200`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const calData = await calRes.json();
    if (!calRes.ok) {
      console.error('Calendar API error:', calData);
      return { statusCode: 500, body: JSON.stringify({ error: 'Calendar fetch failed' }) };
    }

    // Build { "YYYY-MM-DD": [8, 12, 15, ...] } — which hours are booked on each day
    const booked = {};
    (calData.items || []).forEach(function (ev) {
      if (!ev.start || !ev.start.dateTime) return; // skip all-day events
      const dateStr  = getLocalDate(ev.start.dateTime);
      const evStart  = getLocalHour(ev.start.dateTime);
      const evEndStr = ev.end && ev.end.dateTime ? ev.end.dateTime : ev.start.dateTime;
      const evEnd    = getLocalHour(evEndStr);

      SLOTS.forEach(function (slot) {
        // Event overlaps slot if event starts before slot ends AND event ends after slot starts
        if (evStart < slot.end && evEnd > slot.hour) {
          if (!booked[dateStr]) booked[dateStr] = [];
          if (booked[dateStr].indexOf(slot.hour) === -1) booked[dateStr].push(slot.hour);
        }
      });
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      body: JSON.stringify(booked),
    };
  } catch (err) {
    console.error('availability function error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
