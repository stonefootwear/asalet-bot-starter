import fetch from 'node-fetch';

const GEMINI_KEY = (process.env.GEMINI_API_KEY || '').trim();
// موديل رخيص وسريع بالعربي
const MODEL = 'gemini-1.5-flash-8b';

// نحاول نطلع JSON حتى لو جيميناي رجّع نص فيه كلام حوالين الـJSON
function extractJson(txt='') {
  const m = txt.match(/\{[\s\S]*\}$/);
  try { return m ? JSON.parse(m[0]) : JSON.parse(txt); } catch { return null; }
}

export async function parseAdminCommand(text) {
  if (!GEMINI_KEY) return { action: 'none', reason: 'no_gemini_key' };

  const system = `
أنت مساعد لتفسير أوامر إدارية بالعربي (لهجة طبيعية). أخرج فقط JSON بدون أي كلام زائد، بالشكل:

{
  "action": "<set_reply_mode | set_price | set_shipping | set_template | toggle_ig_auto | status>",
  "params": {},
  "message": ""
}

أمثلة فهم:
- "خليك مختصر" => { "action":"set_reply_mode", "params":{"mode":"short"} }
- "خليك مطول" => mode=long
- "خليها تلقائي" => mode=auto
- "غيّر سعر دخون 5+ إلى 19" => { "action":"set_price", "params":{"bukhoor_5plus":19} }
- "سعر الفردي 23" => { "action":"set_price", "params":{"bukhoor_lt5":23} }
- "سعر العطور 80" => { "action":"set_price", "params":{"perfume":80} }
- "الشحن 25" => { "action":"set_shipping", "params":{"shipping_fee":25} }
- "وقّف الرد الآلي" => { "action":"toggle_ig_auto", "params":{"on":false} }
- "شغّل الرد الآلي" => { "action":"toggle_ig_auto", "params":{"on":true} }
- "غيّر نص رد السعر وخلّيه: ...النص..." => { "action":"set_template", "params":{"intent":"price","variant":"short","text":"..."} }
- "الحالة" => { "action":"status" }
`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_KEY}`;
  const body = {
    contents: [{ parts: [{ text: system + "\n\nالأمر:\n" + text }]}],
    generationConfig: { temperature: 0.2, maxOutputTokens: 300 }
  };

  const r = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
  const j = await r.json();
  const cand = j?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const obj = extractJson(cand);
  return obj || { action: 'none', notes: 'parse_error', raw: cand };
}
