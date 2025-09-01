import { getConfig } from '../lib/config.js';

export default async function handler(req, res) {
  try {
    const cfg = await getConfig();
    res.status(200).json({
      ok: true,
      cfg,
      env: {
        hasSheetId: !!process.env.SHEET_ID,
        hasService: !!process.env.GOOGLE_SERVICE_ACCOUNT
      }
    });
  } catch (e) {
    res.status(200).json({ ok: false, error: e?.message || String(e) });
  }
}
