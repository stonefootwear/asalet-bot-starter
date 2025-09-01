import { setConfig, getConfig } from '../lib/config.js';
import { sendToTelegram } from '../lib/telegram.js';
import { normalizeArabic } from '../lib/arabic.js';
import { parseAdminCommand } from '../lib/nlp.js';

const ADMIN_USERNAME = 'Mohamedelmehnkar'; // بدون @
const GROUP_ID = (process.env.TELEGRAM_GROUP_ID || '').trim();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok:false, error:'Method not allowed' });
  try {
    const update = req.body || {};
    const msg = update.message || update.edited_message || {};
    const chatId = String(msg.chat?.id || '');
    const txtRaw = (msg.text || '').trim();
    const fromUser = (msg.from?.username || '');

   const ADMIN_USER_ID = (process.env.TELEGRAM_ADMIN_ID || '').trim();
const adminUser = (process.env.TELEGRAM_ADMIN_USERNAME || 'Mohamedelmehnkar').toLowerCase();
const fromId = String(msg.from?.id || '');
const fromUsername = (msg.from?.username || '').toLowerCase();

const haveAdminRules = !!(ADMIN_USER_ID || adminUser);
const isAdmin =
  (ADMIN_USER_ID && fromId === ADMIN_USER_ID) ||
  (adminUser && fromUsername === adminUser);

// مؤقتًا: لو مفيش قواعد إدمن في env، اسمح لأي عضو في الجروب يبعث أوامر
if (haveAdminRules && !isAdmin) {
  await sendToTelegram(`⚠️ غير مخوّل: fromId=${fromId} username=${fromUsername || '(no username)'}`);
  return res.status(200).json({ ok:true });
}


    const txt = normalizeArabic(txtRaw);

    // حل شامل: نفهم كل الأوامر عبر LLM
    let cmd = await parseAdminCommand(txt);

    // fallback بسيط لو LLM فشل تمامًا
    if (!cmd || cmd.action === 'none') {
      if (/(حال[هة]?|status)/i.test(txt)) cmd = { action:'status' };
    }

    switch (cmd.action) {
      case 'set_reply_mode': {
        const mode = cmd.params?.mode;
        if (!['short','long','auto'].includes(mode)) { await sendToTelegram('❓ صيغة وضع الرد غير مفهومة'); break; }
        await setConfig('reply_mode', mode);
        await sendToTelegram(`✅ وضع الرد: ${mode}`);
        break;
      }
      case 'set_price': {
        const { bukhoor_lt5, bukhoor_5plus, perfume } = cmd.params || {};
        if (bukhoor_lt5 != null)   await setConfig('price_bukhoor_lt5',   bukhoor_lt5);
        if (bukhoor_5plus != null) await setConfig('price_bukhoor_5plus', bukhoor_5plus);
        if (perfume != null)       await setConfig('price_perfume',       perfume);
        await sendToTelegram('✅ تم تحديث الأسعار');
        break;
      }
      case 'set_shipping': {
        const v = cmd.params?.shipping_fee;
        if (v == null) { await sendToTelegram('❓ حدّد قيمة الشحن'); break; }
        await setConfig('shipping_fee', v);
        await sendToTelegram(`✅ الشحن: ${v} درهم`);
        break;
      }
      case 'set_template': {
  let { intent, variant, text } = cmd.params || {};
  if (!intent || !text) { await sendToTelegram('❓ حدّد intent والنص'); break; }
  variant = variant || 'short'; // افتراض
  await setConfig(`tmpl_${intent}_${variant}`, text);
  await sendToTelegram(`✅ تم تحديث قالب ${intent}/${variant}`);
  break;
}

      case 'toggle_ig_auto': {
        const on = !!cmd.params?.on;
        await setConfig('ig_auto', on ? 'on' : 'off');
        await sendToTelegram(on ? '▶️ تشغيل الرد الآلي' : '⏸️ إيقاف الرد الآلي');
        break;
      }
      case 'status': {
        const cfg = await getConfig();
        const summary = Object.entries(cfg).map(([k,v])=>`${k}=${v}`).join('\n') || 'لا إعدادات';
        await sendToTelegram(`ℹ️ الحالة:\n${summary}`);
        break;
      }
      case 'send_to_user': {
        const u = cmd.targets?.username || '';
        const m = cmd.message || '';
        if (!u || !m) { await sendToTelegram('❓ حدّد username والنص'); break; }
        // TODO: ManyChat لاحقاً
        await sendToTelegram(`(تجربة) هنبعت لـ ${u}: ${m}`);
        break;
      }
      case 'broadcast_stalled': {
        const m = cmd.message || 'حيّاك 🌟 إذا حاب نكمّل الطلب خبرنا 😉';
        await sendToTelegram(`(تجربة) بث للمتحفّظين: ${m}`);
        break;
      }
      default:
        await sendToTelegram('✔️ تم. تقدر تكتب بالعامية: "خلّيه مختصر"، "سعر الفردي 23"، "الشحن 25"، "الحالة"…');
    }

    return res.status(200).json({ ok:true });
  } catch (e) {
    await sendToTelegram('❌ حصل خطأ بسيط، جرّب تاني');
    return res.status(200).json({ ok:true });
  }
}
