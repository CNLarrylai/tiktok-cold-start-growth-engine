import type { VercelRequest, VercelResponse } from '@vercel/node';

// Stateless deployment — all user state lives in localStorage on the client.
export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  return res.json({ found: false });
}
