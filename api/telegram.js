import { GAMES, getGame, signLaunch, telegram, webhookSecret } from './_lib.js';

function launchUrlForCallback(q) {
  const game = getGame(q.game_short_name);
  if (!game) throw new Error('Unknown game');

  const data = {
    game: game.shortName,
    user_id: q.from.id,
    chat_id: q.message?.chat?.id ?? null,
    chat_type: q.message?.chat?.type ?? null,
    message_id: q.message?.message_id ?? null,
    inline_message_id: q.inline_message_id ?? null,
    exp: Date.now() + 6 * 60 * 60 * 1000,
  };

  const launch = signLaunch(data);
  const url = new URL(game.url);
  url.searchParams.set('launch', launch);
  return url.toString();
}

async function sendGame(chatId, shortName) {
  await telegram('sendGame', {
    chat_id: chatId,
    game_short_name: shortName,
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({
      ok: true,
      service: 'RawHitz Telegram games webhook',
      games: Object.keys(GAMES),
    });
  }

  const suppliedSecret = req.headers['x-telegram-bot-api-secret-token'];
  if (suppliedSecret !== webhookSecret()) {
    return res.status(401).json({ ok: false, error: 'Invalid webhook secret' });
  }

  try {
    const update = req.body || {};

    if (update.message?.text) {
      const text = update.message.text.trim().toLowerCase();
      const chatId = update.message.chat.id;

      if (text === '/start' || text.startsWith('/start@')) {
        await telegram('sendMessage', {
          chat_id: chatId,
          text: '🎮 Welcome!\n\n/blockrush — play BLOCKRUSH\n/ludo — play LUDORUSH\n/games — show both games',
        });
      } else if (text === '/game' || text.startsWith('/game@') || text === '/blockrush' || text.startsWith('/blockrush@')) {
        await sendGame(chatId, 'blockrushsuper');
      } else if (text === '/ludo' || text.startsWith('/ludo@') || text === '/ludorush' || text.startsWith('/ludorush@')) {
        await sendGame(chatId, 'ludorush');
      } else if (text === '/games' || text.startsWith('/games@')) {
        await telegram('sendMessage', {
          chat_id: chatId,
          text: '🎮 Choose a game:\n\n🧱 /blockrush — Stack. Smash. Survive!\n🎲 /ludo — Roll. Race. Win!',
        });
      }
    }

    if (update.callback_query?.game_short_name) {
      const q = update.callback_query;
      if (getGame(q.game_short_name)) {
        await telegram('answerCallbackQuery', {
          callback_query_id: q.id,
          url: launchUrlForCallback(q),
        });
      }
    }

    if (update.inline_query) {
      const q = (update.inline_query.query || '').toLowerCase();
      let gameNames = ['blockrushsuper', 'ludorush'];
      if (q.includes('ludo')) gameNames = ['ludorush'];
      if (q.includes('block')) gameNames = ['blockrushsuper'];

      await telegram('answerInlineQuery', {
        inline_query_id: update.inline_query.id,
        results: gameNames.map(shortName => ({
          type: 'game',
          id: `${shortName}_game`,
          game_short_name: shortName,
        })),
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
