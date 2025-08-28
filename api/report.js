import { sendToTelegram } from '../lib/telegram.js';

export default async function handler(req, res) {
  try {
    await sendToTelegram('🕚 تقرير اليوم: (placeholder)');
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(200).json({ ok: false, error: String(e) });
  }
}
