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

    const info = await telegram('getWebhookInfo');

    return res.status(200).json({
      ok: true,
      message: 'BLOCKRUSH webhook configured',
      webhook: info,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, error: error.message });
  }
}
