import { telegram, webhookSecret } from './_lib.js';

export default async function handler(req, res) {
  try {
    const host = req.headers.host;
    if (!host) throw new Error('Missing host');
    const webhookUrl = `https://${host}/api/telegram`;

    await telegram('setWebhook', {
      url: webhookUrl,
      secret_token: webhookSecret(),
      allowed_updates: ['message', 'callback_query', 'inline_query'],
      drop_pending_updates: true,
    });

    await telegram('setMyCommands', {
      commands: [
        { command: 'games', description: 'Show all RawHitz games' },
        { command: 'blockrush', description: 'Play BLOCKRUSH' },
        { command: 'ludo', description: 'Play Ludo Rush' },
        { command: 'snake', description: 'Play Snake Rush' },
        { command: 'garden', description: 'Play Snake Garden' },
        { command: 'cricket', description: 'Play CricketRush 3D' },
        { command: 'space', description: 'Play Space Rush' },
        { command: 'castle', description: 'Play Castle Rush' },
        { command: 'tic', description: 'Play Tic Rush' },
        { command: 'checkers', description: 'Play CheckersRush' },
        { command: 'snakeraid', description: 'Play SnakeRaidRush' },
        { command: 'balls', description: 'Play Balls Rush' },
      ],
    });

    const info = await telegram('getWebhookInfo');
    return res.status(200).json({ ok: true, message: 'RawHitz games webhook and commands configured', webhook: info });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, error: error.message });
  }
}
