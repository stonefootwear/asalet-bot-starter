import { normalizeArabic } from './arabic.js';

const GEMINI_KEY = (process.env.GEMINI_API_KEY || '').trim();
const MODEL = 'gemini-1.5-flash-8b';

function tryParseJson(t = '') {
  try { return JSON.parse(t); } catch {
    const m = t.match(/\{[\s\S]*\}/);
    try { return m ? JSON.parse(m[0]) : null; } catch { return null; }
  }
}

export async function parseAdminCommand(rawText) {
  if (!GEMINI_KEY) return { action: 'none', reason: 'no_gemini_key' };

  const text = normalizeArabic(rawText);

  const prompt = `
أنت مساعد أوامر إداري عربي. افهم الصياغات العامية واحصر ردّك في JSON فقط، بلا أي نص زائد.
الشكل:

{
  "action": "<set_reply_mode | set_price | set_shipping | set_template | toggle_ig_auto | status>",
  "params": {},
  "message": ""
}

القواعد:
- set_reply_mode: params.mode = "short"|"long"|"auto"
- set_price: ممكن ترجع أي من { "bukhoor_lt5", "bukhoor_5plus", "perfume" } كأرقام
- set_shipping: { "shipping_fee": رقم }
- set_template: { "intent":"price"|"welcome"|"location", "variant":"short"|"long" (اختياري), "text":"..." }
- toggle_ig_auto: { "on": true|false }
- status: بدون params
- إن لم يُذكر variant في set_template، اعتبره "short".
- رجّع JSON فقط.
`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_KEY}`;
  const body = {
    contents: [{ parts: [{ text: prompt + '\n\nالأمر:\n' + text }]}],
    generationConfig: { temperature: 0.1, maxOutputTokens: 200, responseMimeType: 'application/json' }
  };

  const r = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
  const j = await r.json();
  const out = j?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return tryParseJson(out) || { action: 'none', notes: 'parse_error', raw: out };
}
