export default async function handler(req, res) {
  // --- Auth guard (يدعم header أو query) ---
  const auth = req.headers.authorization || '';
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  const queryKey = (req.query.key || '').toString().trim();

  const okByHeader = process.env.CRON_SECRET && bearer === process.env.CRON_SECRET;
  const okByQuery  = process.env.REPORT_KEY && queryKey === process.env.REPORT_KEY;

  if (!okByHeader && !okByQuery) {
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }

  // ... باقي كود إنشاء/إرسال التقرير هنا ...
}
import { sendToTelegram } from '../lib/telegram.js';

export default async function handler(req, res) {
  try {
    await sendToTelegram('🕚 تقرير اليوم: (placeholder)');
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(200).json({ ok: false, error: String(e) });
  }
}
