// Diagnostic: test which model IDs actually work with this API key
export default async function handler(req: any, res: any) {
  const key = process.env.API_KEY || process.env.GEMINI_API_KEY || '';
  const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

  const candidates = [
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-2.0-flash-exp',
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-1.5-flash-8b',
    'gemini-1.5-flash-8b-latest',
    'gemini-1.5-pro',
    'gemini-1.5-pro-latest',
    'gemini-1.0-pro',
    'gemma-3-27b-it',
    'gemma-3-12b-it',
  ];

  const results: Record<string, string> = {};

  for (const model of candidates) {
    try {
      const r = await fetch(`${BASE}/${model}:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'Hi' }] }] }),
      });
      const d: any = await r.json();
      if (r.ok) {
        results[model] = '✅ OK';
      } else {
        const code = d?.error?.code;
        const msg = d?.error?.message?.slice(0, 80);
        results[model] = `❌ ${code}: ${msg}`;
      }
    } catch (e: any) {
      results[model] = `💥 ${e.message}`;
    }
  }

  return res.json(results);
}
