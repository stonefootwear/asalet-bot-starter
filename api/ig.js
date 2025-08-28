export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }
  try {
    const body = req.body || {};
    const textRaw = (body.text ?? '').toString().trim();
    const lower = textRaw.toLowerCase();

    // --- رسائل ثابتة حسب اتفاقنا ---
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

    // مطابقة الكلمات المفتاحية
    if (/(price|how much|بكم)/i.test(textRaw)) {
      reply = priceAR;
    } else if (/(location|وين مكانكم)/i.test(textRaw)) {
      reply = locationAR;
    }

    return res.status(200).json({ ok: true, reply });
  } catch (e) {
    return res.status(200).json({ ok: false, reply: 'صار خلل بسيط، جرّب بعد لحظات 🙏' });
  }
}
