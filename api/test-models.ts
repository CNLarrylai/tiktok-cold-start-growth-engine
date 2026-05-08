// Diagnostic: test which model IDs actually work with this API key
export default async function handler(req: any, res: any) {
  const key = process.env.API_KEY || process.env.GEMINI_API_KEY || '';
  const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

  // Test both v1beta and v1 endpoints with various model IDs
  const candidates = [
    { model: 'gemini-2.0-flash',           v: 'v1beta' },
    { model: 'gemini-2.0-flash-lite',      v: 'v1beta' },
    { model: 'gemini-1.5-flash',           v: 'v1beta' },
    { model: 'gemini-1.5-flash-latest',    v: 'v1beta' },
    { model: 'gemini-1.5-flash',           v: 'v1'     },
    { model: 'gemini-1.5-flash-latest',    v: 'v1'     },
    { model: 'gemini-1.5-flash-8b',        v: 'v1'     },
    { model: 'gemini-1.5-flash-8b-latest', v: 'v1'     },
    { model: 'gemini-1.5-pro',             v: 'v1'     },
    { model: 'gemini-1.5-pro-latest',      v: 'v1'     },
    { model: 'gemma-3-27b-it',             v: 'v1beta' },
  ];

  const results: Record<string, string> = {};

  for (const { model, v } of candidates) {
    const label = `[${v}] ${model}`;
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/${v}/models/${model}:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'Hi' }] }] }),
      });
      const d: any = await r.json();
      if (r.ok) {
        results[label] = '✅ OK';
      } else {
        const code = d?.error?.code;
        const msg = d?.error?.message?.slice(0, 80);
        results[label] = `❌ ${code}: ${msg}`;
      }
    } catch (e: any) {
      results[label] = `💥 ${e.message}`;
    }
  }

  return res.json(results);
}
