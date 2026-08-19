import { allowCors, telegram, verifyLaunch } from './_lib.js';

export default async function handler(req, res) {
  allowCors(res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  try {
    const { launch, score, mode, delta } = req.body || {};
    const data = verifyLaunch(launch);

    if (!data.chat_id && !data.inline_message_id) {
      throw new Error('This game was not launched from a Telegram game message');
    }

    const messageRef = {};
    if (data.inline_message_id) {
      messageRef.inline_message_id = data.inline_message_id;
    } else {
      messageRef.chat_id = data.chat_id;
      messageRef.message_id = data.message_id;
    }

    const highPayload = { user_id: data.user_id, ...messageRef };
    let highscores = [];
    try {
      highscores = await telegram('getGameHighScores', highPayload);
    } catch (e) {
      console.error('getGameHighScores before update failed:', e.message);
    }

    const mine = highscores.find(x => Number(x.user?.id) === Number(data.user_id));
    const current = Number(mine?.score || 0);

    if (mode === 'cricket_get') {
      return res.status(200).json({ ok: true, rating: current, highscores });
    }

    let numericScore;
    let earned = 0;

    if (mode === 'cricket') {
      earned = Number(delta);
      if (!Number.isInteger(earned) || earned < 0 || earned > 5000) {
        throw new Error('Invalid CricketRush rating delta');
      }
      numericScore = current + earned;
    } else {
      numericScore = Number(score);
      if (!Number.isInteger(numericScore) || numericScore < 0 || numericScore > 100000000) {
        throw new Error('Invalid score');
      }
    }

    const payload = {
      user_id: data.user_id,
      score: numericScore,
      force: false,
      disable_edit_message: false,
      ...messageRef,
    };

    await telegram('setGameScore', payload);

    try {
      highscores = await telegram('getGameHighScores', highPayload);
    } catch (e) {
      console.error('getGameHighScores after update failed:', e.message);
    }

    return res.status(200).json({
      ok: true,
      highscores,
      rating: mode === 'cricket' ? numericScore : undefined,
      earned: mode === 'cricket' ? earned : undefined,
    });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ ok: false, error: error.message });
  }
}
