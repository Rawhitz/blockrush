import { GAME_SHORT_NAME, GAME_URL, signLaunch, telegram } from './_lib.js';

function launchUrlForCallback(q) {
  const data = {
    user_id: q.from.id,
    chat_id: q.message?.chat?.id ?? null,
    message_id: q.message?.message_id ?? null,
    inline_message_id: q.inline_message_id ?? null,
    exp: Date.now() + 6 * 60 * 60 * 1000,
  };

  const launch = signLaunch(data);
  const url = new URL(GAME_URL);
  url.searchParams.set('launch', launch);
  return url.toString();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({ ok: true, service: 'BLOCKRUSH Telegram webhook' });
  }

  try {
    const update = req.body || {};

    if (update.message?.text) {
      const text = update.message.text.trim();
      const chatId = update.message.chat.id;

      if (text === '/start' || text.startsWith('/start@')) {
        await telegram('sendMessage', {
          chat_id: chatId,
          text: '🎮 Welcome to BLOCKRUSH!\n\nUse /game to start playing.',
        });
      } else if (text === '/game' || text.startsWith('/game@')) {
        await telegram('sendGame', {
          chat_id: chatId,
          game_short_name: GAME_SHORT_NAME,
        });
      }
    }

    if (update.callback_query?.game_short_name === GAME_SHORT_NAME) {
      const q = update.callback_query;
      await telegram('answerCallbackQuery', {
        callback_query_id: q.id,
        url: launchUrlForCallback(q),
      });
    }

    if (update.inline_query) {
      await telegram('answerInlineQuery', {
        inline_query_id: update.inline_query.id,
        results: [
          {
            type: 'game',
            id: 'blockrush_game',
            game_short_name: GAME_SHORT_NAME,
          },
        ],
        cache_time: 0,
        is_personal: true,
      });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error(error);
    return res.status(200).json({ ok: false, error: error.message });
  }
}
