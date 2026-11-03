/**
 * POST /api/chat — Agentic RAG with Groq tool calling + Supabase pgvector
 *
 * Architecture:
 * 1. User sends a message
 * 2. Agent (Groq) decides which tools to call
 * 3. Tools execute (vector search, product detail, filter, policies)
 * 4. Tool results fed back to agent
 * 5. Agent generates final structured response { reply, products[], intent }
 *
 * Benefits over catalog-stuffing:
 * - Only retrieves relevant products (not all 16+ every time)
 * - Scales to 1000s of products without breaking context window
 * - Semantic search finds "soft everyday layer" → jacket/sweater without exact keywords
 * - Agent can chain tools for complex queries
 */

import { auth } from '@clerk/nextjs/server';
import Groq from 'groq-sdk';
import { appendChatExchange } from 'lib/chat-history';
import { getAllCollections, getProduct, getProducts } from 'lib/store';
import { getEmbeddingCount, searchProductsSemantic } from 'lib/vector-search';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/* ── Exported types ────────────────────────────────────────────── */
export type ChatProduct = {
  id: string;
  title: string;
  price: string;
  compareAtPrice?: string;
  imageUrl: string;
  url: string;
  colors: string[];
  sizes: string[];
  inStock: boolean;
};

export type ChatResponse = {
  reply: string;
  products: ChatProduct[];
  intent: 'greeting' | 'product_search' | 'product_detail' | 'policy' | 'other';
};

/* ── Tool definitions for Groq tool calling ───────────────────── */
const TOOLS: Groq.Chat.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'search_products',
      description:
        'Semantically search products by natural language query. Use this for product recommendations, finding items by style, material, occasion, or description. Returns the most relevant products.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description:
              'Natural language search query, e.g. "soft everyday layer for cool weather", "black leather bag under $80", "summer outfit accessories"'
          },
          max_results: {
            type: 'number',
            description: 'Maximum number of products to return (1-6, default 4)'
          }
        },
        required: ['query']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'filter_products',
      description:
        'Filter products by specific criteria like price range, color, size, material, or stock status. Use when the user has specific requirements.',
      parameters: {
        type: 'object',
        properties: {
          max_price: { type: 'number', description: 'Maximum price in USD' },
          min_price: { type: 'number', description: 'Minimum price in USD' },
          color: { type: 'string', description: 'Color name e.g. Black, Olive, Natural' },
          size: { type: 'string', description: 'Size e.g. M, L, XL, 30, 10' },
          material: { type: 'string', description: 'Material e.g. Leather, Cotton, Canvas' },
          product_type: {
            type: 'string',
            description:
              'Product type e.g. Jackets, Sneakers, Tote bags, Jeans, Shirts, T-shirts, Sunglasses'
          },
          in_stock_only: {
            type: 'boolean',
            description: 'Only return products that are in stock'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_product_detail',
      description:
        'Get full details about a specific product by its ID. Use when the user asks about a specific product.',
      parameters: {
        type: 'object',
        properties: {
          product_id: {
            type: 'string',
            description:
              'Product ID e.g. field-jacket, everyday-tote, studio-sneaker, linen-shirt'
          }
        },
        required: ['product_id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_store_policies',
      description:
        'Get store policies about shipping, returns, payment, sizing. Use when the user asks about these topics.',
      parameters: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            enum: ['shipping', 'returns', 'payment', 'sizing', 'all'],
            description: 'Which policy to retrieve'
          }
        },
        required: ['topic']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_collections',
      description: 'Get available product collections/categories in the store.',
      parameters: { type: 'object', properties: {} }
    }
  }
];

/* ── Tool execution ───────────────────────────────────────────── */
type ToolArgs = Record<string, unknown>;

async function executeTool(
  name: string,
  args: ToolArgs,
  embeddingsAvailable: boolean
): Promise<string> {
  try {
    switch (name) {
      case 'search_products': {
        const query = String(args.query ?? '');
        const maxResults = Math.min(Number(args.max_results ?? 4), 6);

        if (embeddingsAvailable) {
          // Use vector search
          const results = await searchProductsSemantic(query, maxResults, 0.2);
          if (results.length === 0) {
            return JSON.stringify({ results: [], message: 'No products found matching that description.' });
          }
          return JSON.stringify({
            results: results.map((r) => ({
              id: r.id,
              title: r.title,
              description: r.description,
              similarity: Math.round(r.similarity * 100) + '%',
              ...r.metadata
            }))
          });
        } else {
          // Fallback: keyword search
          const products = await getProducts({ query });
          return JSON.stringify({
            results: products.slice(0, maxResults).map((p) => ({
              id: p.id,
              title: p.title,
              description: p.description,
              price: `$${p.priceRange.minVariantPrice.amount}`,
              imageUrl: p.featuredImage.url,
              url: `/product/${p.handle.replace('/product/', '')}`,
              colors: p.colors,
              sizes: p.sizes,
              inStock: p.availableForSale,
              productType: p.productType,
              material: p.material
            })),
            note: 'Vector search not yet seeded — using keyword search'
          });
        }
      }

      case 'filter_products': {
        const products = await getProducts({
          minPrice: args.min_price !== undefined ? Number(args.min_price) : undefined,
          maxPrice: args.max_price !== undefined ? Number(args.max_price) : undefined,
          color: args.color ? [String(args.color)] : undefined,
          size: args.size ? [String(args.size)] : undefined,
          material: args.material ? [String(args.material)] : undefined,
          productType: args.product_type ? [String(args.product_type)] : undefined,
          inStock: args.in_stock_only === true
        });
        return JSON.stringify({
          results: products.slice(0, 6).map((p) => ({
            id: p.id,
            title: p.title,
            description: p.description,
            price: `$${p.priceRange.minVariantPrice.amount}`,
            imageUrl: p.featuredImage.url,
            url: `/product/${p.handle.replace('/product/', '')}`,
            colors: p.colors,
            sizes: p.sizes,
            inStock: p.availableForSale,
            productType: p.productType,
            material: p.material
          })),
          total: products.length
        });
      }

      case 'get_product_detail': {
        const id = String(args.product_id ?? '');
        const product = await getProduct(id);
        if (!product) return JSON.stringify({ error: `Product "${id}" not found.` });
        const stock = product.variants.reduce((s, v) => s + v.inventoryQuantity, 0);
        const price = Number(product.priceRange.minVariantPrice.amount);
        const compareAt = Number(product.priceRange.minCompareAtPrice.amount);
        return JSON.stringify({
          id: product.id,
          title: product.title,
          description: product.description,
          price: `$${price}`,
          compareAtPrice: compareAt > price ? `$${compareAt}` : undefined,
          discount: compareAt > price ? `${Math.round(((compareAt - price) / compareAt) * 100)}% off` : undefined,
          material: product.material,
          productType: product.productType,
          colors: product.colors,
          sizes: product.sizes,
          totalStock: stock,
          availableForSale: product.availableForSale,
          imageUrl: product.featuredImage.url,
          url: `/product/${product.handle.replace('/product/', '')}`,
          collections: product.collectionHandles
        });
      }

      case 'get_store_policies': {
        const topic = String(args.topic ?? 'all');
        const policies: Record<string, string> = {
          shipping: 'Free shipping on orders over $100. Standard delivery 3-5 business days. Express available at checkout.',
          returns: '30-day hassle-free returns on unworn items with original tags. Initiate returns via your account or contact support.',
          payment: 'We accept all major credit cards, PayPal, and UPI. All transactions are SSL encrypted.',
          sizing: 'Clothing runs true to size. Check individual product pages for detailed size guides. We recommend measuring before ordering.'
        };
        if (topic === 'all') return JSON.stringify(policies);
        return JSON.stringify({ [topic]: policies[topic] ?? 'Policy information not available.' });
      }

      case 'get_collections': {
        const collections = await getAllCollections();
        return JSON.stringify({
          collections: collections
            .filter((c) => !c.hidden)
            .map((c) => ({ title: c.title, handle: c.handle, description: c.description, url: c.path }))
        });
      }

      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  } catch (err) {
    console.error(`[tool:${name}] error:`, err);
    return JSON.stringify({ error: `Tool ${name} failed: ${err instanceof Error ? err.message : String(err)}` });
  }
}

/* ── Final answer schema ───────────────────────────────────────── */
const ANSWER_TOOL: Groq.Chat.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'answer',
    description: 'Provide the final answer to the user after gathering all necessary information.',
    parameters: {
      type: 'object',
      properties: {
        reply: {
          type: 'string',
          description: 'Your friendly conversational response (max 120 words, no markdown headers)'
        },
        products: {
          type: 'array',
          description: 'Products to show — populate only when products are directly relevant (max 4)',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              price: { type: 'string' },
              compareAtPrice: { type: 'string' },
              imageUrl: { type: 'string' },
              url: { type: 'string' },
              colors: { type: 'array', items: { type: 'string' } },
              sizes: { type: 'array', items: { type: 'string' } },
              inStock: { type: 'boolean' }
            },
            required: ['id', 'title', 'price', 'imageUrl', 'url', 'colors', 'sizes', 'inStock']
          }
        },
        intent: {
          type: 'string',
          enum: ['greeting', 'product_search', 'product_detail', 'policy', 'other']
        }
      },
      required: ['reply', 'products', 'intent']
    }
  }
};

/* ── System prompt (lean — no product catalog) ─────────────────── */
function buildSystemPrompt(): string {
  const siteName = process.env.SITE_NAME ?? 'LEATHER MART 313';
  return `You are a friendly, knowledgeable shopping assistant for ${siteName}, a fashion and lifestyle store.

You have access to tools to search and retrieve product information. Always use tools to find relevant products before answering product questions — never make up products.

## Your tools
- search_products: Semantic search by natural language (preferred for product recommendations)
- filter_products: Filter by price, color, size, material, or stock
- get_product_detail: Get full info about a specific product
- get_store_policies: Shipping, returns, payment, sizing policies
- get_collections: List all categories

## Behavior rules
- For product questions: call search_products or filter_products FIRST, then answer
- For specific product questions: call get_product_detail
- For policy questions: call get_store_policies
- Keep your final reply under 120 words
- Be warm, helpful, and conversational
- Never mention tools or internal workings to the user
- After gathering info, call the answer tool with reply + relevant products`;
}

/* ── Main POST handler ─────────────────────────────────────────── */
export async function POST(request: NextRequest) {
  try {
    const { messages } = (await request.json()) as {
      messages: { role: string; content: string }[];
    };

    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: 'messages array is required.' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'AI service is not configured.' }, { status: 503 });
    }

    const { userId } = await auth();
    const groq = new Groq({ apiKey });

    // Check if embeddings are seeded (non-blocking — falls back to keyword search)
    const embeddingCount = await getEmbeddingCount().catch(() => 0);
    const embeddingsAvailable = embeddingCount > 0;

    // Build conversation for the agent
    const conversation: Groq.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: buildSystemPrompt() },
      ...(messages as { role: 'user' | 'assistant'; content: string }[])
    ];

    let finalResponse: ChatResponse | null = null;
    const maxIterations = 5; // prevent infinite loops

    // ── Agentic loop ──
    for (let iteration = 0; iteration < maxIterations; iteration++) {
      const allTools = iteration < maxIterations - 1
        ? [...TOOLS, ANSWER_TOOL]
        : [ANSWER_TOOL]; // force answer on last iteration

      const completion = await groq.chat.completions.create({
        model: 'qwen/qwen3.8-27b',
        messages: conversation,
        tools: allTools,
        tool_choice: iteration < maxIterations - 1 ? 'auto' : { type: 'function', function: { name: 'answer' } },
        max_tokens: 1024,
        temperature: 0.3
      });

      const message = completion.choices[0]?.message;
      if (!message) break;

      // Add assistant message to conversation
      conversation.push(message as Groq.Chat.ChatCompletionMessageParam);

      const toolCalls = message.tool_calls;
      if (!toolCalls || toolCalls.length === 0) {
        // No tool calls — extract text as final reply
        finalResponse = {
          reply: message.content ?? 'Sorry, I could not generate a response.',
          products: [],
          intent: 'other'
        };
        break;
      }

      // Check if the answer tool was called
      const answerCall = toolCalls.find((tc) => tc.function.name === 'answer');
      if (answerCall) {
        try {
          const args = JSON.parse(answerCall.function.arguments) as ChatResponse;
          finalResponse = {
            reply: args.reply ?? '',
            products: Array.isArray(args.products) ? args.products.slice(0, 4) : [],
            intent: args.intent ?? 'other'
          };
        } catch {
          finalResponse = { reply: 'Sorry, something went wrong.', products: [], intent: 'other' };
        }
        break;
      }

      // Execute all tool calls and add results to conversation
      const toolResults = await Promise.all(
        toolCalls.map(async (tc) => {
          let args: ToolArgs = {};
          try { args = JSON.parse(tc.function.arguments) as ToolArgs; } catch { /* ignore */ }
          const result = await executeTool(tc.function.name, args, embeddingsAvailable);
          return {
            role: 'tool' as const,
            tool_call_id: tc.id,
            content: result
          };
        })
      );

      conversation.push(...toolResults);
    }

    if (!finalResponse) {
      finalResponse = { reply: 'Sorry, I could not generate a response. Please try again.', products: [], intent: 'other' };
    }

    // Save to Supabase for signed-in users
    if (userId) {
      const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
      if (lastUserMessage) {
        void appendChatExchange(userId, lastUserMessage.content, {
          content: finalResponse.reply,
          products: finalResponse.products,
          intent: finalResponse.intent
        });
      }
    }

    return Response.json(finalResponse);
  } catch (error) {
    console.error('[/api/chat] Error:', error instanceof Error ? error.message : error);
    return Response.json({ error: 'Chat service unavailable. Please try again.' }, { status: 500 });
  }
}
