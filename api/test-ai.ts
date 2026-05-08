// Minimal diagnostic: no shared imports, no SDK, just raw fetch
export default async function handler(req: any, res: any) {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || '';
  if (!apiKey) return res.json({ ok: false, error: 'API_KEY env var not found' });

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Reply with the single word: working' }] }]
        })
      }
    );
    const d: any = await r.json();
    return res.json({
      ok: r.ok,
      httpStatus: r.status,
      aiText: d?.candidates?.[0]?.content?.parts?.[0]?.text ?? null,
      rawResponse: r.ok ? undefined : d
    });
  } catch (e: any) {
    return res.json({ ok: false, error: e.message });
  }
}
