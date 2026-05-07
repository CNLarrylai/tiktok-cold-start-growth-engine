import { GoogleGenAI } from '@google/genai';

// Lazy init so the constructor runs inside the request, not at module load time
let _ai: GoogleGenAI | null = null;
function getAI() {
  if (!_ai) _ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY || '' });
  return _ai;
}

const MODELS = [
  "gemma-3-27b-it",
  "gemma-3-12b-it",
  "gemma-3-4b-it",
  "gemma-3-1b-it",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-flash-001",
];

export async function generateWithFallback(
  prompt: string,
  modelConfig: Record<string, unknown> = {}
): Promise<string> {
  let lastError: Error | null = null;

  for (const modelName of MODELS) {
    try {
      const config = { ...modelConfig };
      // Gemma models reject responseMimeType
      if (modelName.includes('gemma')) delete config.responseMimeType;

      const response = await getAI().models.generateContent({
        model: modelName,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config,
      });

      const text = response.text;
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
