// lib/arabic.js
// تطبيع نص عربي قبل الإرسال للـLLM، عشان يقلل حساسية الإملاء
const DIACRITICS = /[\u064B-\u0652\u0670\u0653-\u065F]/g; // تشكيل
const TATWEEL = /\u0640/g;

const AR_DIGITS = /[٠١٢٣٤٥٦٧٨٩]/g;
const AR_DIGITS_MAP = { '٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9' };

export function normalizeArabic(input = '') {
  let s = String(input);
  s = s.replace(DIACRITICS, '');      // شيل التشكيل
  s = s.replace(TATWEEL, '');         // شيل التطويل
  s = s.replace(/[إأآا]/g, 'ا');      // توحيد الألف
  s = s.replace(/ى/g, 'ي');           // ياء/ألف مقصورة
  s = s.replace(/ؤ/g, 'و').replace(/ئ/g, 'ي'); // همزات وسطية
  s = s.replace(AR_DIGITS, d => AR_DIGITS_MAP[d]); // أرقام عربية -> إنجليزية
  s = s.replace(/\s+/g, ' ').trim();  // مسافات زائدة
  return s;
}
