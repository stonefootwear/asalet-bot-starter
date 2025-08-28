export default function handler(req, res) {
  res.status(200).json({ ok: true, ping: 'health', time: new Date().toISOString() });
}
