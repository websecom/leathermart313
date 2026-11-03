import 'server-only';

import type { ChatProduct, ChatResponse } from 'app/api/chat/route';

/* ── Supabase config (reuses same env vars as catalog-storage) ── */
function getConfig() {
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return { url, key };
}

export function isChatHistoryConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
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
    throw new Error(`Supabase chat history error (${res.status}): ${detail}`);
  }
  return res;
}

/* ── Types ── */
export type StoredMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  products: ChatProduct[];
  intent: ChatResponse['intent'];
  createdAt: string;
};

type ChatRow = {
  id: number;
  role: string;
  content: string;
  products: unknown;
  intent: string;
  created_at: string;
};

/* ── Load last N messages for a user ── */
export async function loadChatHistory(
  userId: string,
  limit = 40
): Promise<StoredMessage[]> {
  if (!isChatHistoryConfigured()) return [];
  try {
    const res = await supabase(
      `store_chat_history?select=id,role,content,products,intent,created_at&user_id=eq.${encodeURIComponent(userId)}&order=created_at.asc&limit=${limit}`
    );
    const rows = (await res.json()) as ChatRow[];
    return rows.map((row) => ({
      id: String(row.id),
      role: row.role as 'user' | 'assistant',
      content: row.content,
      products: Array.isArray(row.products) ? (row.products as ChatProduct[]) : [],
      intent: (row.intent as ChatResponse['intent']) ?? 'other',
      createdAt: row.created_at
    }));
  } catch (err) {
    console.error('[chat-history] loadChatHistory error:', err);
    return [];
  }
}

/* ── Append a single message for a user ── */
export async function appendChatMessage(
  userId: string,
  message: Omit<StoredMessage, 'id' | 'createdAt'>
): Promise<void> {
  if (!isChatHistoryConfigured()) return;
  try {
    await supabase('store_chat_history', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        user_id: userId,
        role: message.role,
        content: message.content,
        products: message.products ?? [],
        intent: message.intent ?? 'other'
      })
    });
  } catch (err) {
    // Non-fatal — chat still works even if history fails to save
    console.error('[chat-history] appendChatMessage error:', err);
  }
}

/* ── Append both user + assistant messages in one call ── */
export async function appendChatExchange(
  userId: string,
  userContent: string,
  assistantReply: Omit<StoredMessage, 'id' | 'createdAt' | 'role'>
): Promise<void> {
  if (!isChatHistoryConfigured()) return;
  try {
    await supabase('store_chat_history', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify([
        {
          user_id: userId,
          role: 'user',
          content: userContent,
          products: [],
          intent: 'other'
        },
        {
          user_id: userId,
          role: 'assistant',
          content: assistantReply.content,
          products: assistantReply.products ?? [],
          intent: assistantReply.intent ?? 'other'
        }
      ])
    });
  } catch (err) {
    console.error('[chat-history] appendChatExchange error:', err);
  }
}

/* ── Clear all history for a user ── */
export async function clearChatHistory(userId: string): Promise<void> {
  if (!isChatHistoryConfigured()) return;
  await supabase(
    `store_chat_history?user_id=eq.${encodeURIComponent(userId)}`,
    { method: 'DELETE' }
  );
}
