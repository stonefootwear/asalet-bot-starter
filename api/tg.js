import { setConfig, getConfig } from '../lib/config.js';
import { sendToTelegram }     from '../lib/telegram.js';
import { normalizeArabic }    from '../lib/arabic.js';
import { parseAdminCommand }  from '../lib/nlp.js';

// إعدادات الوصول
const ADMIN_USERNAME = (process.env.TELEGRAM_ADMIN_USERNAME || 'Mohamedelmehnkar').toLowerCase(); // بدون @
const ADMIN_USER_ID  = (process.env.TELEGRAM_ADMIN_ID || '').trim(); // اختياري
const GROUP_ID       = (process.env.TELEGRAM_GROUP_ID || '').trim(); // -100...

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    // 1) قراءة الرسالة
    const update  = req.body || {};
    const msg     = update.message || update.edited_message || {};
    const chatId  = String(msg.chat?.id || '');
    const txtRaw  = (msg.text || '').trim();
    const fromId  = String(msg.from?.id || '');
    const fromUsr = (msg.from?.username || '').toLowerCase();

    // 2) فلتر الجروب (لو GROUP_ID متضبط)
    if (GROUP_ID && chatId !== GROUP_ID) {
      return res.status(200).json({ ok: true, ignored: true });
    }

    // 3) التحقق من الإدمن (لو متضبط TELEGRAM_ADMIN_ID/USERNAME)
    const haveAdminRules = !!(ADMIN_USER_ID || ADMIN_USERNAME);
    const isAdmin =
      (ADMIN_USER_ID && fromId === ADMIN_USER_ID) ||
      (ADMIN_USERNAME && fromUsr === ADMIN_USERNAME);

    if (haveAdminRules && !isAdmin) {
      await sendToTelegram('⚠️ غير مخوّل');
      return res.status(200).json({ ok: true });
    }

    // 4) تطبيع النص وتمريره لـ LLM
    const text = normalizeArabic(txtRaw);
    let cmd = await parseAdminCommand(text);
if (!cmd || cmd.action === 'none') {
  await sendToTelegram('ما نفذت أي تغيير.');
  return res.status(200).json({ ok:true, ignored:true });
}

    // 5) فولباك بسيط لو الـLLM رجع none
    if (!cmd || cmd.action === 'none') {
      if (/^(?:\/)?status\b/i.test(text) || /الحال[هة]/.test(text)) {
        cmd = { action: 'status' };
      }
    }

    // 6) تنفيذ الأوامر
    switch (cmd.action) {
      case 'set_reply_mode': {
        const mode = cmd.params?.mode;
        if (!['short','long','auto'].includes(mode)) {
          await sendToTelegram('❓ صيغة وضع الرد غير مفهومة');
          break;
        }
        await setConfig('reply_mode', mode);
        await sendToTelegram(`✅ وضع الرد: ${mode}`);
        break;
      }

      case 'set_price': {
        const { bukhoor_lt5, bukhoor_5plus, perfume } = cmd.params || {};
        if (bukhoor_lt5   != null) await setConfig('price_bukhoor_lt5',   bukhoor_lt5);
        if (bukhoor_5plus != null) await setConfig('price_bukhoor_5plus', bukhoor_5plus);
        if (perfume       != null) await setConfig('price_perfume',       perfume);
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
        let { intent, variant, text: t } = cmd.params || {};
        if (!intent || !t) { await sendToTelegram('❓ حدّد intent والنص'); break; }
        const vr = variant || 'short'; // افتراضي
        await setConfig(`tmpl_${intent}_${vr}`, t);
        await sendToTelegram(`✅ تم تحديث قالب ${intent}/${vr}`);
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
        const summary = Object.entries(cfg).map(([k,v]) => `${k}=${v}`).join('\n') || 'لا إعدادات';
        await sendToTelegram(`ℹ️ الحالة:\n${summary}`);
        break;
      }

      // أمثلة تجريبية
      case 'send_to_user': {
        const u = cmd.targets?.username || '';
        const m = cmd.message || '';
        if (!u || !m) { await sendToTelegram('❓ username و message مطلوبين'); break; }
        await sendToTelegram(`(تجربة) هابعت لـ @${u}: ${m}`);
        break;
      }

      case 'broadcast_stalled': {
        const m = cmd.message || 'حياكم 🌟';
        await sendToTelegram(`(تجربة) بث للمستهدفين (حركي): ${m}`);
        break;
      }

      default: {
        // رد قصير من غير إرشادات
        await sendToTelegram('✅ تم.');
        break;
      }
    }

    // 7) رجّع 200 دايمًا عشان تيليجرام يكون راضي
    return res.status(200).json({ ok: true });

  } catch (e) {
    await sendToTelegram(`❌ حصل خطأ بسيط: ${e?.message || String(e)}`);
    return res.status(200).json({ ok: true });
  }
}
