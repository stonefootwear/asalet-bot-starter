// api/debug-tg.js
export default async function handler(req, res) {
  try {
    const token  = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_GROUP_ID;
    const text   = (req.query.text || 'Debug ping from Vercel').toString();

    if (!token || !chatId) {
      return res.status(200).json({ ok: false, error: 'missing env' });
    }

    const api = `https://api.telegram.org/bot${token}/sendMessage`;
    const r = await fetch(api, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true })
    });
    const j = await r.json();
    return res.status(200).json({ ok: true, telegram: j });
  } catch (e) {
    return res.status(200).json({ ok: false, error: e?.message || String(e) });
  }
}
