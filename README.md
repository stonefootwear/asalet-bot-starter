
# Asalet Duhmaan – Instagram Assistant (Starter)

Starter backend for Vercel serverless functions.

## What’s inside
- `api/ig.js` – webhook endpoint for Instagram/ManyChat
- `api/tg.js` – webhook endpoint for Telegram bot
- `api/report.js` – daily report endpoint (can be called by a free cron service)
- `lib/sheets.js` – helper to write rows to Google Sheets using a Service Account
- `lib/pricing.js` – pricing rules (edit here when needed)
- `lib/telegram.js` – send messages to Telegram group
- `lib/utils.js` – misc helpers

## Env Vars (set in Vercel → Project → Settings → Environment Variables)
- `OPENAI_API_KEY`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_GROUP_ID` (e.g., -1002834532598)
- `GOOGLE_SERVICE_ACCOUNT` (full JSON content as ONE line)
- `SHEET_ID` (the Google Sheet ID only, e.g., 1pfzVnelWddFseSXz2WBPg3Sr-sZVmhMJu3LiMzoi6YU)
- `REPORT_TZ` (e.g., Africa/Cairo)
- `FALLBACK_LANG` (e.g., ar)
- `PAGE_NAME` (Instagram page name to store in the sheet)

## Deploy
1. Create a GitHub repo and upload these files (or import to Vercel directly if you prefer another provider).
2. On Vercel, create a new project and connect the repo.
3. Add the Env Vars above.
4. Hit Deploy.

## Cron (Daily report)
If Vercel Cron is unavailable on your plan, use a free cron service (e.g., cron-job.org) to call:
`https://<your-vercel-domain>/api/report` every day at **23:00 Africa/Cairo**.
