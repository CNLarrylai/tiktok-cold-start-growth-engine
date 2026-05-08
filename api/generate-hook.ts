import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateWithFallback, extractJson } from '../lib/ai-helper';

export const maxDuration = 30;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (req.headers['x-app-servicegrow-security'] !== 'sg-safe-v1') {
    return res.status(403).json({ error: 'Access denied.' });
  }

  const { nicheInput } = req.body ?? {};
  if (!nicheInput) return res.status(400).json({ error: 'nicheInput is required' });

  try {
    const prompt = `You are a viral TikTok script writer. Generate a high-conversion JSON hook for the "${nicheInput}" niche with keys: result, topic, action. JSON ONLY.`;
    const raw = await generateWithFallback(prompt, { responseMimeType: 'application/json' });
    return res.json(extractJson(raw));
  } catch (e: any) {
    return res.json({ result: 'Viral Growth', topic: 'consistency', action: 'sleeping on it' });
  }
}
