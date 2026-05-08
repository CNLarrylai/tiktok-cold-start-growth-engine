export const maxDuration = 30;

const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const MODELS = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-flash-lite-latest', 'gemini-2.0-flash-lite', 'gemma-4-31b-it', 'gemma-4-26b-a4b-it'];

async function callAI(prompt: string): Promise<string> {
  const key = process.env.API_KEY || process.env.GEMINI_API_KEY || '';
  let lastErr: Error | null = null;
  for (const model of MODELS) {
    try {
      const r = await fetch(`${BASE}/${model}:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }] }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
      const d: any = await r.json();
      const text = d?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('Empty response');
      console.log(`[AI] Success with ${model}`);
      return text;
    } catch (e: any) {
      lastErr = e;
      console.warn(`[AI] ${model} failed: ${e.message}`);
    }
  }
  throw lastErr ?? new Error('All models exhausted');
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (req.headers['x-app-servicegrow-security'] !== 'sg-safe-v1') return res.status(403).json({ error: 'Access denied.' });

  const { bioInput } = req.body ?? {};
  if (!bioInput) return res.status(400).json({ error: 'bioInput is required' });

  try {
    const prompt = `Transform this TikTok bio into a high-conversion niche authority bio: "${bioInput}". Use emojis, focus on results and authority, include a clear CTA. Return only the optimized bio text.`;
    let result = (await callAI(prompt)).trim();
    result = result.replace(/^["']|["']$/g, '').replace(/^(Here is your|Optimized|Result):?\s*/i, '');
    return res.json({ result });
  } catch {
    return res.json({ result: '🚀 Build your niche authority today! (AI busy — try again in 1 min)' });
  }
}
