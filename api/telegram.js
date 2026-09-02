import { GAMES, getGame, signLaunch, telegram, webhookSecret } from './_lib.js';

function launchUrlForCallback(q) {
  const game = getGame(q.game_short_name);
  if (!game) throw new Error('Unknown game');
  const data = { game: game.shortName, user_id: q.from.id, chat_id: q.message?.chat?.id ?? null, chat_type: q.message?.chat?.type ?? null, message_id: q.message?.message_id ?? null, inline_message_id: q.inline_message_id ?? null, exp: Date.now() + 6 * 60 * 60 * 1000 };
  const launch = signLaunch(data);
  const url = new URL(game.url); url.searchParams.set('launch', launch); return url.toString();
}
async function sendGame(chatId, shortName) { await telegram('sendGame', { chat_id: chatId, game_short_name: shortName }); }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).json({ ok: true, service: 'RawHitz Telegram games webhook', games: Object.keys(GAMES) });
  if (req.headers['x-telegram-bot-api-secret-token'] !== webhookSecret()) return res.status(401).json({ ok: false, error: 'Invalid webhook secret' });
  try {
    const update = req.body || {};
    if (update.message?.text) {
      const text = update.message.text.trim().toLowerCase(), chatId = update.message.chat.id;
      if (text === '/start' || text.startsWith('/start@')) {
        await telegram('sendMessage', { chat_id: chatId, text: '🎮 Welcome!\n\n/blockrush — play BLOCKRUSH\n/ludo — play LUDORUSH\n/snake — play SNAKERUSH\n/garden — play SNAKE GARDEN\n/cricket — play CRICKETRUSH 3D\n/space — play SPACE RUSH\n/castle — play CASTLERUSH\n/tic — play TICRUSH\n/checkers — play CHECKERSRUSH\n/snakeraid — play SNAKERAIDRUSH\n/balls — play BALLS RUSH\n/games — show all games' });
      } else if (text === '/game' || text.startsWith('/game@') || text === '/blockrush' || text.startsWith('/blockrush@')) await sendGame(chatId, 'blockrushsuper');
      else if (text === '/ludo' || text.startsWith('/ludo@') || text === '/ludorush' || text.startsWith('/ludorush@')) await sendGame(chatId, 'ludorush');
      else if (text === '/snake' || text.startsWith('/snake@') || text === '/snakerush' || text.startsWith('/snakerush@')) await sendGame(chatId, 'snakerush');
      else if (text === '/garden' || text.startsWith('/garden@') || text === '/snakegarden' || text.startsWith('/snakegarden@')) await sendGame(chatId, 'snakegarden');
      else if (text === '/cricket' || text.startsWith('/cricket@') || text === '/cricketrush' || text.startsWith('/cricketrush@')) await sendGame(chatId, 'cricketrush');
      else if (text === '/space' || text.startsWith('/space@') || text === '/spacerush' || text.startsWith('/spacerush@')) await sendGame(chatId, 'spacerush');
      else if (text === '/castle' || text.startsWith('/castle@') || text === '/castlerush' || text.startsWith('/castlerush@')) await sendGame(chatId, 'castlerush');
      else if (text === '/tic' || text.startsWith('/tic@') || text === '/ticrush' || text.startsWith('/ticrush@')) await sendGame(chatId, 'ticrush');
      else if (text === '/checkers' || text.startsWith('/checkers@') || text === '/checkersrush' || text.startsWith('/checkersrush@')) await sendGame(chatId, 'CheckersRush');
      else if (text === '/snakeraid' || text.startsWith('/snakeraid@') || text === '/snakeraidrush' || text.startsWith('/snakeraidrush@')) await sendGame(chatId, 'snakeraidrush');
      else if (text === '/balls' || text.startsWith('/balls@') || text === '/ballsrush' || text.startsWith('/ballsrush@')) await sendGame(chatId, 'ballsrush');
      else if (text === '/games' || text.startsWith('/games@')) await telegram('sendMessage', { chat_id: chatId, text: '🎮 Choose a game:\n\n🧱 /blockrush — Stack. Smash. Survive!\n🎲 /ludo — Roll. Race. Win!\n🐍 /snake — Climb ladders. Dodge snakes. Race to 100!\n🌿 /garden — Classic Snake in a living garden!\n🏏 /cricket — Bat, bowl and play in 3D!\n🚀 /space — Blast. Dodge. Survive!\n🏰 /castle — Fire. Multiply. Destroy!\n❌⭕ /tic — Think. Block. Dominate!\n🔵⭐🔴 /checkers — Jump. Strategize. Conquer!\n🐉 /snakeraid — Slay. Upgrade. Loot. Repeat!\n🔴 /balls — Bounce. Dodge. Collect. Escape!' });
    }
    if (update.callback_query?.game_short_name) {
      const q = update.callback_query;
      if (getGame(q.game_short_name)) await telegram('answerCallbackQuery', { callback_query_id: q.id, url: launchUrlForCallback(q) });
    }
    if (update.inline_query) {
      const q = (update.inline_query.query || '').toLowerCase();
      let gameNames = ['blockrushsuper','ludorush','snakerush','snakegarden','cricketrush','spacerush','castlerush','ticrush','CheckersRush','snakeraidrush','ballsrush'];
      if (q.includes('ludo')) gameNames=['ludorush'];
      if (q.includes('block')) gameNames=['blockrushsuper'];
      if (q.includes('garden')) gameNames=['snakegarden']; else if (q.includes('snake raid') || q.includes('raid')) gameNames=['snakeraidrush']; else if (q.includes('snake')) gameNames=['snakerush','snakegarden','snakeraidrush'];
      if (q.includes('cricket')) gameNames=['cricketrush']; if(q.includes('space'))gameNames=['spacerush']; if(q.includes('castle'))gameNames=['castlerush']; if(q.includes('tic'))gameNames=['ticrush']; if(q.includes('checker'))gameNames=['CheckersRush']; if(q.includes('ball'))gameNames=['ballsrush'];
      await telegram('answerInlineQuery',{inline_query_id:update.inline_query.id,results:gameNames.map(shortName=>({type:'game',id:`${shortName.toLowerCase()}_game`,game_short_name:shortName})),cache_time:0,is_personal:true});
    }
    return res.status(200).json({ ok: true });
  } catch (error) { console.error(error); return res.status(200).json({ ok:false,error:error.message }); }
}
