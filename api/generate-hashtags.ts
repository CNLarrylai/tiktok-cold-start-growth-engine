import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateWithFallback } from '../lib/ai-helper';

export const maxDuration = 30;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (req.headers['x-app-servicegrow-security'] !== 'sg-safe-v1') {
    return res.status(403).json({ error: 'Access denied.' });
  }

  const { nicheInput } = req.body ?? {};
  if (!nicheInput) return res.status(400).json({ error: 'nicheInput is required' });

  try {
    const prompt = `Generate 20 high-performing TikTok hashtags for the "${nicheInput}" niche. Mix viral (#fyp, #foryou), niche-specific, and community tags. Return ONLY a JSON array of strings. Example: ["#fyp","#niche"]`;
    const raw = await generateWithFallback(prompt, { responseMimeType: 'application/json' });

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
