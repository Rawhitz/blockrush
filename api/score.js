import { allowCors, telegram, verifyLaunch } from './_lib.js';

export default async function handler(req, res) {
  allowCors(res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  try {
    const { launch, score } = req.body || {};
    const data = verifyLaunch(launch);
    const numericScore = Number(score);

    if (!Number.isInteger(numericScore) || numericScore < 0 || numericScore > 100000000) {
      throw new Error('Invalid score');
    }

    const payload = {
      user_id: data.user_id,
      score: numericScore,
      force: false,
      disable_edit_message: false,
    };

    if (data.inline_message_id) {
      payload.inline_message_id = data.inline_message_id;
    } else {
      payload.chat_id = data.chat_id;
      payload.message_id = data.message_id;
    }

    await telegram('setGameScore', payload);
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ ok: false, error: error.message });
  }
}
