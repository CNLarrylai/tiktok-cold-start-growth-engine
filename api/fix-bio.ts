import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateWithFallback } from '../lib/ai-helper';

export const maxDuration = 30;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (req.headers['x-app-servicegrow-security'] !== 'sg-safe-v1') {
    return res.status(403).json({ error: 'Access denied.' });
  }

  const { bioInput } = req.body ?? {};
  if (!bioInput) return res.status(400).json({ error: 'bioInput is required' });

  try {
    const prompt = `Transform this TikTok bio into a high-conversion niche authority bio: "${bioInput}". Use emojis, focus on results and authority, include a clear CTA. Return only the optimized bio text.`;
    let result = (await generateWithFallback(prompt)).trim();
    result = result.replace(/^["']|["']$/g, '').replace(/^(Here is your|Optimized|Result):?\s*/i, '');
    return res.json({ result });
  } catch {
    return res.json({ result: '🚀 Build your niche authority today! (AI busy — try again in 1 min)' });
  }
}
