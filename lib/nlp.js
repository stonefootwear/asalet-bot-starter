import { normalizeArabic } from './arabic.js';

const GEMINI_KEY = (process.env.GEMINI_API_KEY || '').trim();
const MODEL = 'gemini-1.5-flash-8b';

// التقاط JSON حتى لو فيه نص حوالينه
function extractJson(txt = '') {
  const m = txt.match(/\{[\s\S]*\}$/);
  try { return m ? JSON.parse(m[0]) : JSON.parse(txt); } catch { return null; }
}

export async function parseAdminCommand(rawText) {
  if (!GEMINI_KEY) return { action: 'none', reason: 'no_gemini_key' };

  const text = normalizeArabic(rawText);

  // تعليمات صارمة لـGemini: افهم أي صياغة وأخرج JSON فقط
  const system = `
أنت مساعد أوامر إدارية عربي. افهم الصياغات الحرة حتى مع اختلاف الإملاء (الحالة/الحاله، مختصر/قصير، مطوّل/طويل، تلقائي/اوتوماتيك…).
لا تكتب أي كلام خارج JSON. أعد فقط JSON بهذا الشكل:

{
  "action": "<set_reply_mode | set_price | set_shipping | set_template | toggle_ig_auto | status | send_to_user | broadcast_stalled>",
  "params": {},
  "targets": {},
  "message": ""
}

التفاصيل:
- set_reply_mode: params.mode = "short" | "long" | "auto"
- set_price: أي قيمة مذكورة للسعر التلقطها: { "bukhoor_lt5":<num>, "bukhoor_5plus":<num>, "perfume":<num> } (اختياريًا)
- set_shipping: { "shipping_fee": <num> }
- set_template: { "intent":"price"|"location"|"welcome", "variant":"short"|"long", "text":"..." }
- toggle_ig_auto: { "on": true|false } (شغّل/وقّف الرد الآلي)
- status: (بدون params)
- send_to_user: { } و "targets": {"username":"@user"} و "message":"نص"
- broadcast_stalled: { "wait":"2h" } و "message":"نص لطيف"

ملاحظات:
- حوّل الأرقام العربية لإنجليزية داخليًا عند الفهم.
- تجاهل التشكيل، التطويل، اختلافات الهمزة، ى/ي، ة/ه في آخر الكلمة إن وُجد.
- إن لم تتأكد، اختر أقرب action منطقي، ولا تضع نصوص توضيحية خارج JSON.
`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_KEY}`;
  const body = {
    contents: [{ parts: [{ text: system + "\n\nالأمر:\n" + text }]}],
    generationConfig: { temperature: 0.1, maxOutputTokens: 300 }
  };

  const r = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
  const j = await r.json();
  const out = j?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const obj = extractJson(out);
  return obj || { action: 'none', notes: 'parse_error', raw: out };
}
