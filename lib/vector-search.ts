import 'server-only';

import { embedText, embedBatch } from 'lib/embeddings';
import type { Product } from 'lib/types';

/* ── Supabase helper ─────────────────────────────────────────────── */
function getConfig() {
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return { url, key };
}

async function supabase(path: string, init?: RequestInit) {
  const config = getConfig();
  if (!config) throw new Error('Supabase is not configured.');
  const res = await fetch(`${config.url}/rest/v1/${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      'Content-Type': 'application/json',
      ...init?.headers
    }
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Supabase vector-search error (${res.status}): ${detail}`);
  }
  return res;
}

async function supabaseRpc(fn: string, params: Record<string, unknown>) {
  const config = getConfig();
  if (!config) throw new Error('Supabase is not configured.');
  const res = await fetch(`${config.url}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    cache: 'no-store',
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Supabase RPC ${fn} error (${res.status}): ${detail}`);
  }
  return res;
}

/* ── Types ────────────────────────────────────────────────────────── */
export type VectorSearchResult = {
  id: string;
  title: string;
  description: string;
  content: string;
  metadata: {
    price: string;
    compareAtPrice?: string;
    imageUrl: string;
    url: string;
    colors: string[];
    sizes: string[];
    inStock: boolean;
    productType: string;
    material: string;
    collections: string[];
  };
  similarity: number;
};

/* ── Build searchable text for a product ─────────────────────────── */
function productToContent(product: Product): string {
  const price = Number(product.priceRange.minVariantPrice.amount);
  const stock = product.variants.reduce((s, v) => s + v.inventoryQuantity, 0);
  return [
    product.title,
    product.description,
    `${product.material} ${product.productType}`,
    `Colors: ${product.colors.join(', ')}`,
    product.sizes.length > 0 ? `Sizes: ${product.sizes.join(', ')}` : '',
    `Price: $${price}`,
    stock > 0 ? 'In stock' : 'Out of stock',
    `Collections: ${product.collectionHandles.join(', ')}`
  ]
    .filter(Boolean)
    .join('. ');
}

/* ── Seed all products into pgvector ─────────────────────────────── */
export async function seedProductEmbeddings(products: Product[]): Promise<{
  seeded: number;
  errors: string[];
}> {
  const errors: string[] = [];
  const contents = products.map(productToContent);

  let embeddings: number[][];
  try {
    embeddings = await embedBatch(contents);
  } catch (err) {
    throw new Error(`Embedding generation failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  const rows = products.map((product, i) => {
    const price = product.priceRange.minVariantPrice.amount;
    const compareAt = product.priceRange.minCompareAtPrice.amount;
    const selling = Number(price);
    const compare = Number(compareAt);
    const stock = product.variants.reduce((s, v) => s + v.inventoryQuantity, 0);
    return {
      id: product.id,
      title: product.title,
      description: product.description,
      content: contents[i],
      // Supabase expects vector as a string "[0.1,0.2,...]"
      embedding: `[${(embeddings[i] ?? []).join(',')}]`,
      metadata: {
        price: `$${Number(price).toLocaleString()}`,
        compareAtPrice: compare > selling ? `$${compare.toLocaleString()}` : undefined,
        imageUrl: product.featuredImage.url,
        url: `/product/${product.handle.replace('/product/', '')}`,
        colors: product.colors,
        sizes: product.sizes,
        inStock: stock > 0,
        productType: product.productType,
        material: product.material,
        collections: product.collectionHandles
      },
      updated_at: new Date().toISOString()
    };
  });

  // Upsert in batches of 5
  const batchSize = 5;
  let seeded = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    try {
      await supabase('store_product_embeddings?on_conflict=id', {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify(batch)
      });
      seeded += batch.length;
    } catch (err) {
      errors.push(`Batch ${i}–${i + batch.length}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { seeded, errors };
}

/* ── Semantic product search ─────────────────────────────────────── */
export async function searchProductsSemantic(
  query: string,
  matchCount = 4,
  minSimilarity = 0.25
): Promise<VectorSearchResult[]> {
  let queryEmbedding: number[];
  try {
    queryEmbedding = await embedText(query);
  } catch (err) {
    console.error('[vector-search] embedText failed:', err);
    return [];
  }

  try {
    const res = await supabaseRpc('match_products', {
      query_embedding: `[${queryEmbedding.join(',')}]`,
      match_count: matchCount,
      min_similarity: minSimilarity
    });
    const rows = (await res.json()) as Array<{
      id: string;
      title: string;
      description: string;
      content: string;
      metadata: VectorSearchResult['metadata'];
      similarity: number;
    }>;
    return rows;
  } catch (err) {
    console.error('[vector-search] match_products RPC failed:', err);
    return [];
  }
}

/* ── Check if embeddings table is seeded ──────────────────────────── */
export async function getEmbeddingCount(): Promise<number> {
  try {
    const res = await supabase(
      'store_product_embeddings?select=id&limit=1',
      { headers: { Prefer: 'count=exact' } }
    );
    const count = res.headers.get('content-range');
    // content-range: 0-0/16
    const total = count?.split('/')[1];
    return total ? parseInt(total, 10) : 0;
  } catch {
    return 0;
  }
}
