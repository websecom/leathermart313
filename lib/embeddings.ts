import 'server-only';

// Lazy-loaded pipeline — only downloaded once and cached in memory
let pipeline: ((text: string | string[], options?: Record<string, unknown>) => Promise<unknown>) | null = null;

async function getPipeline() {
  if (pipeline) return pipeline;
  // Dynamic import — Transformers.js runs fully in Node.js, no API key needed
  const { pipeline: createPipeline, env } = await import('@xenova/transformers');
  // Cache models in .next/cache/transformers to avoid re-downloading
  env.cacheDir = '.next/cache/transformers';
  // Use all-MiniLM-L6-v2 — 384 dimensions, fast, good semantic quality
  pipeline = await createPipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  return pipeline;
}

/**
 * Generate a 384-dim embedding vector for a text string.
 * Runs locally in Node.js — no API key, no external calls.
 */
export async function embedText(text: string): Promise<number[]> {
  const extractor = await getPipeline();
  const output = (await extractor(text, { pooling: 'mean', normalize: true })) as {
    data: Float32Array;
  };
  return Array.from(output.data);
}

/**
 * Embed multiple texts in one batch (more efficient for seeding).
 */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  const extractor = await getPipeline();
  const output = (await extractor(texts, { pooling: 'mean', normalize: true })) as {
    data: Float32Array;
    dims: number[];
  };
  // output.data is flat: [vec0dim0, vec0dim1, ..., vec1dim0, ...]
  const dims = output.dims[1] ?? 384;
  const result: number[][] = [];
  for (let i = 0; i < texts.length; i++) {
    result.push(Array.from(output.data.slice(i * dims, (i + 1) * dims)));
  }
  return result;
}

export const EMBEDDING_DIMS = 384;
