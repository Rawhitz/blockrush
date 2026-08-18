import crypto from 'crypto';

export const GAME_SHORT_NAME = 'blockrushsuper';
export const GAME_URL = 'https://rawhitz.github.io/blockrush/';

export function getBotToken() {
  const token = process.env.BLOCKRUSH_BOT_TOKEN;
  if (!token) throw new Error('BLOCKRUSH_BOT_TOKEN is not configured');
  return token;
}

export async function telegram(method, payload = {}) {
  const token = getBotToken();
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!data.ok) {
    throw new Error(`${method} failed: ${data.description || 'Unknown Telegram error'}`);
  }
  return data.result;
}

function signingKey() {
  return crypto.createHash('sha256').update(getBotToken()).digest();
}

export function signLaunch(data) {
  const payload = Buffer.from(JSON.stringify(data)).toString('base64url');
  const sig = crypto.createHmac('sha256', signingKey()).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyLaunch(token) {
  if (!token || !token.includes('.')) throw new Error('Missing launch token');
  const [payload, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', signingKey()).update(payload).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) throw new Error('Invalid launch token');
  const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  if (!data.exp || Date.now() > data.exp) throw new Error('Launch token expired');
  return data;
}

export function allowCors(res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://rawhitz.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
