export const maxDuration = 30;

const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-flash-8b', 'gemma-3-27b-it', 'gemma-3-12b-it'];

async function callAI(prompt: string, jsonMode = false): Promise<string> {
  const key = process.env.API_KEY || process.env.GEMINI_API_KEY || '';
  let lastErr: Error | null = null;
  for (const model of MODELS) {
    try {
      const body: any = { contents: [{ role: 'user', parts: [{ text: prompt }] }] };
      if (jsonMode && !model.includes('gemma')) {
        body.generationConfig = { responseMimeType: 'application/json' };
      }
      const r = await fetch(`${BASE}/${model}:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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

  const { nicheInput } = req.body ?? {};
  if (!nicheInput) return res.status(400).json({ error: 'nicheInput is required' });

  try {
    const prompt = `Generate 20 high-performing TikTok hashtags for the "${nicheInput}" niche. Mix viral (#fyp, #foryou), niche-specific, and community tags. Return ONLY a JSON array of strings. Example: ["#fyp","#niche"]`;
    const raw = await callAI(prompt, true);

    let hashtags: string[];
    try {
      const match = raw.match(/\[[\s\S]*\]/);
      hashtags = JSON.parse(match ? match[0] : raw);
      if (!Array.isArray(hashtags)) throw new Error('not array');
      hashtags = hashtags.slice(0, 20);
    } catch {
      const slug = nicheInput.toLowerCase().replace(/\s+/g, '');
      hashtags = ['#fyp', '#foryou', '#viral', `#${slug}`, '#tiktok', '#trending', '#creator'];
    }
    return res.json({ hashtags });
  } catch {
    return res.json({ hashtags: ['#fyp', '#foryou', '#viral', '#tiktok', '#trending', '#creator'] });
  }
}
