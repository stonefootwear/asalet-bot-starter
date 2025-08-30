export default async function handler(req, res) {
  try {
    const method = req.method || 'GET';
    let textRaw = '';

    if (method === 'POST') {
      textRaw = ((req.body && req.body.text) || '').toString().trim();
    } else if (method === 'GET') {
      textRaw = ((req.query && req.query.text) || '').toString().trim();
    } else {
      return res.status(405).json({ ok: false, error: 'Method not allowed' });
    }

    const priceAR =
`• دخون: 23 درهم/الحبة — وعند 5 حبات أو أكثر: 19 درهم/الحبة
• عطور: 80 درهم/القطعة
• الشحن داخل الإمارات: 20 درهم`;

    const locationAR =
`حيّاك الله 🌟 نخدمك أونلاين داخل الإمارات والتوصيل خلال 1–3 أيام عمل.
للحين ما فتحنا محل، وإن شاء الله قريب بنبشّركم 🌸`;

    const welcomeAR =
`حيّاك الله 🌟 نورتنا.
إذا تبغي نسجّل طلبك مباشرة عطنا: دخون أو عطور + الكمية + رقم موبايل إماراتي + المنطقة + طريقة الدفع (تحويل/عند الاستلام). ونرتّب لك كل شي بسرعة.
وإذا تحتاج شيء مثل السعر أو التوصيل، نحن حاضرون وبالخدمة 😉`;

    let reply = welcomeAR;

    if (/(price|how much|بكم)/i.test(textRaw)) {
      reply = priceAR;
    } else if (/(location|وين مكانكم)/i.test(textRaw)) {
      reply = locationAR;
    }

    if (!textRaw && method === 'GET') {
      return res.status(200).json({ ok: true, hint: 'أضِف ?text=بكم إلى الرابط', reply });
    }

    return res.status(200).json({ ok: true, reply, input: textRaw, method });
  } catch (e) {
    return res.status(200).json({ ok: false, reply: 'صار خلل بسيط، جرّب بعد لحظات 🙏' });
  }
}
