const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

const MODELS = [
  'gemma-3-27b-it',
  'gemma-3-12b-it',
  'gemma-3-4b-it',
  'gemma-3-1b-it',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-001',
];

export async function generateWithFallback(
  prompt: string,
  modelConfig: Record<string, unknown> = {}
): Promise<string> {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || '';
  let lastError: Error | null = null;

  for (const modelName of MODELS) {
    try {
      const body: Record<string, unknown> = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      };

      // Gemma models reject responseMimeType
      if (modelConfig.responseMimeType && !modelName.includes('gemma')) {
        body.generationConfig = { responseMimeType: modelConfig.responseMimeType };
      }

      const res = await fetch(`${BASE_URL}/${modelName}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);

      const data = await res.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('Empty response');

      console.log(`[AI] Success with ${modelName}`);
      return text;
    } catch (e: any) {
      lastError = e;
      console.warn(`[AI] ${modelName} failed: ${e.message}`);
    }
  }
  throw lastError ?? new Error('All AI models exhausted.');
}

export function extractJson(text: string): Record<string, unknown> {
  try {
    const match = text.match(/\{[\s\S]*\}/);
    return JSON.parse(match ? match[0] : text);
  } catch {
    return { result: text.slice(0, 100), topic: 'Growth Tips', action: 'Check Bio' };
  }
}
