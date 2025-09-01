import fetch from 'node-fetch';

export default async function handler(req, res) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_GROUP_ID;
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const payload = { chat_id: chatId, text: '🔧 Debug ping from Vercel', disable_web_page_preview: true };

  let telegramResp = null;
  try {
    const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
    telegramResp = await r.json();
  } catch (e) {
    telegramResp = { ok: false, error: String(e) };
  }

  res.status(200).json({
    env: { hasToken: !!token, hasChat: !!chatId },
    telegram: telegramResp
  });
}
await sendToTelegram(`DEBUG chat=${chatId} fromId=${msg.from?.id} username=${msg.from?.username || '(none)'} txt=${txtRaw}`);
