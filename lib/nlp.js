import { normalizeArabic } from './arabic.js';

const GEMINI_KEY = (process.env.GEMINI_API_KEY || '').trim();
// موديل سريع ورخيص بالعربي
const MODEL = 'gemini-1.5-flash-8b';

function tryParseJson(t = '') {
  try { return JSON.parse(t); } catch {
    const m = t.match(/\{[\s\S]*\}/);
    try { return m ? JSON.parse(m[0]) : null; } catch { return null; }
  }
}

// نتيجـة fallback واضحة
function noAction(message = 'no_action') {
  return { action: 'none', params: {}, message };
}

/**
 * ترجع واحد من الأوامر الآتية فقط:
 *   set_reply_mode | set_price | set_shipping | set_template | toggle_ig_auto | status
 *   (وفي مشروعك فيه send_to_user و broadcast_stalled اختياريًا)
 * لو مافيش أمر مفهوم => action='none' مع message='no_action'
 */
export async function parseAdminCommand(rawText = '') {
  if (!GEMINI_KEY) return noAction('no_gemini_key');

  const text = normalizeArabic(rawText);

  // نخلي النموذج يرجّع JSON فقط
  const system = `
انت مساعد أوامر إداري بالعربي (تقبل العامية). أعِدّ فقط JSON بدون أي كلام زائد.
الأوامر المسموحة فقط (غير كده اعتبره "لا أمر"): 
- set_reply_mode      { "mode": "short" | "long" | "auto" }
- set_price           { "bukhoor_lt5"?: number, "bukhoor_5plus"?: number, "perfume"?: number }
- set_shipping        { "shipping_fee": number }
- set_template        { "intent":"price"|"welcome"|"location", "variant":"short"|"long" (اختياري), "text": string }
- toggle_ig_auto      { "on": true|false }
- status              {}

ارسل JSON بالهيكل:
{
  "action": "<one_of_allowed_actions_or_none>",
  "params": {},
  "message": ""
}

مثـالـات:
- "خليك مختصر"        => {"action":"set_reply_mode","params":{"mode":"short"}}
- "خليك مطول"         => {"action":"set_reply_mode","params":{"mode":"long"}}
- "خليها تلقائي"      => {"action":"set_reply_mode","params":{"mode":"auto"}}
- "سعر الفردي 23"     => {"action":"set_price","params":{"bukhoor_lt5":23}}
- "سعر 5+ 19"         => {"action":"set_price","params":{"bukhoor_5plus":19}}
- "العطور 80"         => {"action":"set_price","params":{"perfume":80}}
- "الشحن 25"          => {"action":"set_shipping","params":{"shipping_fee":25}}
- "غيّر رد السعر وخلّيه: خمس غرشات ... " 
                       => {"action":"set_template","params":{"intent":"price","variant":"short","text":"خمس غرشات ..."}}
- "وقف الرد الآلي"    => {"action":"toggle_ig_auto","params":{"on":false}}
- "شغل الرد الآلي"    => {"action":"toggle_ig_auto","params":{"on":true}}
- "الحالة"            => {"action":"status"}

لو النص لا يطابق أي أمر: أعد {"action":"none","params":{},"message":"no_action"} فقط.
`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_KEY}`;
  const body = {
    contents: [{ parts: [{ text: system + '\n\nالنص:\n' + text }]}],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 200,
      responseMimeType: 'application/json'
    }
  };

  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body)
    });
    const j = await r.json();
    const out = j?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const obj = tryParseJson(out);

    // تحقق من أن الإجراء من ضمن المسموح به
    const allowed = new Set([
      'set_reply_mode','set_price','set_shipping',
      'set_template','toggle_ig_auto','status',
      'send_to_user','broadcast_stalled' // إن احتجتها
    ]);

    if (!obj || !obj.action || !allowed.has(obj.action)) {
      return noAction(); // عشان ما يحصلش "تم"
    }

    // تنظيف بسيط للأرقام لو موجودة كسلاسل
    if (obj.action === 'set_price' && obj.params) {
      for (const k of ['bukhoor_lt5','bukhoor_5plus','perfume']) {
        if (obj.params[k] != null) obj.params[k] = Number(obj.params[k]);
      }
    }
    if (obj.action === 'set_shipping' && obj.params?.shipping_fee != null) {
      obj.params.shipping_fee = Number(obj.params.shipping_fee);
    }
    if (obj.action === 'set_template' && obj.params) {
      if (!obj.params.variant) obj.params.variant = 'short';
    }

    return obj;

  } catch (e) {
    return noAction('llm_error');
  }
}
