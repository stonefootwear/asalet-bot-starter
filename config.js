import { google } from 'googleapis';

const SHEET_ID = process.env.SHEET_ID;
const SERVICE_JSON = process.env.GOOGLE_SERVICE_ACCOUNT;
const CONFIG_SHEET = 'config';

async function sheetsClient() {
  const creds = JSON.parse(SERVICE_JSON);
  const jwt = new google.auth.JWT(
    creds.client_email,
    null,
    creds.private_key,
    ['https://www.googleapis.com/auth/spreadsheets']
  );
  return google.sheets({ version: 'v4', auth: jwt });
}

export async function getConfig() {
  try {
    const sheets = await sheetsClient();
    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${CONFIG_SHEET}!A:B`,
    });
    const rows = resp.data.values || [];
    const map = {};
    for (let i = 1; i < rows.length; i++) {
      const [k, v] = rows[i];
      if (k) map[k] = v ?? '';
    }
    return map;
  } catch (e) {
    return {};
  }
}

export async function setConfig(key, value) {
  const sheets = await sheetsClient();

  // تأكيد وجود العناوين
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${CONFIG_SHEET}!A1:B1`,
    valueInputOption: 'RAW',
    requestBody: { values: [['key', 'value']] }
  });

  // هل الكي موجود؟
  const list = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${CONFIG_SHEET}!A:A`,
  });
  const rows = (list.data.values || []).map(r => r[0]);

  // أول صف للعناوين => البحث يبدأ من الصف 2 (index 1)
  let rowIndex = rows.findIndex(v => v === key);
  if (rowIndex >= 1) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${CONFIG_SHEET}!B${rowIndex + 1}`,
      valueInputOption: 'RAW',
      requestBody: { values: [[String(value)]] }
    });
  } else {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${CONFIG_SHEET}!A:B`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [[key, String(value)]] }
    });
  }
}
