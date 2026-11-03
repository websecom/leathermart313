'use client';

import { useAuth } from '@clerk/nextjs';
import type { ChatProduct, ChatResponse } from 'app/api/chat/route';
import type { StoredMessage } from 'lib/chat-history';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

/* ── Types ─────────────────────────────────────────────────────── */
type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  products?: ChatProduct[];
  intent?: ChatResponse['intent'];
};

/* ── Markdown renderer ─────────────────────────────────────────── */
function renderMarkdown(text: string) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];

  function flushList() {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="mt-1.5 space-y-0.5 pl-3">
          {listItems}
        </ul>
      );
      listItems = [];
    }
  }

  function parseInline(raw: string, key: string): React.ReactNode {
    const parts = raw.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);
    return (
      <span key={key}>
        {parts.map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="font-semibold text-[#17211f]">{part.slice(2, -2)}</strong>;
          }
          const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
          if (linkMatch) {
            return (
              <a key={i} href={linkMatch[2]!}
                className="font-medium text-[#526c3a] underline underline-offset-2 hover:text-[#304a2a]"
              >
                {linkMatch[1]}
              </a>
            );
          }
          return part;
        })}
      </span>
    );
  }

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) { flushList(); return; }
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      listItems.push(
        <li key={index} className="flex gap-1.5">
          <span className="mt-[3px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#9aad8e]" />
          <span>{parseInline(trimmed.slice(2), `li-${index}`)}</span>
        </li>
      );
    } else {
      flushList();
      elements.push(<p key={index} className="leading-5">{parseInline(trimmed, `p-${index}`)}</p>);
    }
  });
  flushList();
  return <div className="space-y-1">{elements}</div>;
}

/* ── Product card ──────────────────────────────────────────────── */
function ProductCard({ product }: { product: ChatProduct }) {
  return (
    <Link
      href={product.url}
      className="group flex items-center gap-3 rounded-xl border border-[#e1e7de] bg-white p-2.5 transition-all hover:border-[#9aad8e] hover:shadow-sm"
    >
      <div className="relative h-14 w-14 flex-none overflow-hidden rounded-lg bg-[#ede8e0]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.imageUrl}
          alt={product.title}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] font-semibold text-[#17211f] group-hover:text-[#3d6b24]">
          {product.title}
        </p>
        <div className="mt-0.5 flex items-center gap-1.5">
          <span className="text-[12px] font-semibold text-[#17211f]">{product.price}</span>
          {product.compareAtPrice && (
            <span className="text-[10px] text-[#8a928b] line-through">{product.compareAtPrice}</span>
          )}
        </div>
        {product.colors.length > 0 && (
          <p className="mt-0.5 truncate text-[10px] text-[#68736b]">
            {product.colors.join(' · ')}
          </p>
        )}
      </div>
      <span className="flex-none text-[11px] font-semibold text-[#9aad8e] group-hover:text-[#526c3a]">
        View →
      </span>
    </Link>
  );
}

/* ── Suggestions ───────────────────────────────────────────────── */
const SUGGESTIONS = [
  'What bags do you have?',
  'Show me jackets',
  'What sizes are available?',
  'Tell me about your return policy',
];

function storedToMessage(s: StoredMessage): Message {
  return {
    id: s.id,
    role: s.role,
    content: s.content,
    products: s.products,
    intent: s.intent
  };
}

/* ── Main component ────────────────────────────────────────────── */
export default function ChatWidget() {
  const { isSignedIn } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [error, setError] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* Load persisted history when signed-in user opens chat */
  const loadHistory = useCallback(async () => {
    if (!isSignedIn || historyLoaded) return;
    try {
      const res = await fetch('/api/chat/history');
      if (!res.ok) return;
      const data = (await res.json()) as { messages: StoredMessage[] };
      if (data.messages.length > 0) {
        setMessages(data.messages.map(storedToMessage));
      }
    } catch {
      // silently ignore — history is non-critical
    } finally {
      setHistoryLoaded(true);
    }
  }, [isSignedIn, historyLoaded]);

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      void loadHistory();
    }
  }, [isOpen, loadHistory]);

  // Reset history state when user signs out so it reloads on next sign-in
  useEffect(() => {
    if (!isSignedIn) {
      setHistoryLoaded(false);
      setMessages([]);
    }
  }, [isSignedIn]);

  function openChat() { setIsOpen(true); setHasOpened(true); }

  async function clearHistory() {
    if (!isSignedIn || isClearing) return;
    setIsClearing(true);
    try {
      await fetch('/api/chat/history', { method: 'DELETE' });
      setMessages([]);
    } catch {
      // ignore
    } finally {
      setIsClearing(false);
    }
  }

  async function sendMessage(text: string) {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);
    setError(false);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content }))
        })
      });

      if (!res.ok) throw new Error('API error');

      const data = (await res.json()) as ChatResponse & { error?: string };
      if (data.error) throw new Error(data.error);

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply ?? '',
        products: data.products ?? [],
        intent: data.intent
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void sendMessage(input);
  }

  return (
    <>
      {/* ── Floating button ── */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
        {!isOpen && !hasOpened && (
          <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-[#172c27] opacity-25" />
        )}
        <button
          onClick={() => (isOpen ? setIsOpen(false) : openChat())}
          aria-label={isOpen ? 'Close chat' : 'Open shopping assistant'}
          className="flex items-center justify-center rounded-full bg-[#172c27] shadow-lg transition-all hover:bg-[#27483d] hover:shadow-xl active:scale-95"
          style={{ height: 52, width: 52 }}
        >
          {isOpen ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          )}
        </button>
      </div>

      {/* ── Chat panel ── */}
      {isOpen && (
        <div
          className="fixed bottom-20 right-4 z-50 flex w-[calc(100vw-2rem)] max-w-[380px] flex-col overflow-hidden rounded-2xl border border-[#dce3d8] bg-white shadow-2xl"
          style={{ height: 540 }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-[#e8ece6] bg-[#172c27] px-4 py-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#c6f36b]">
              <svg viewBox="0 0 24 24" fill="none" stroke="#172c27" strokeWidth="2" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-white">Shopping Assistant</p>
              <p className="text-[10px] text-white/60">
                {isSignedIn ? 'History saved to your account' : ' 🙂 LEATHER MART 313 🙂'}
              </p>
            </div>
            {/* Clear history button — only for signed-in users with messages */}
            {isSignedIn && messages.length > 0 && (
              <button
                onClick={() => void clearHistory()}
                disabled={isClearing}
                title="Clear chat history"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-40"
                aria-label="Clear chat history"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto p-4">

            {/* Welcome + suggestions */}
            {messages.length === 0 && (
              <div className="space-y-3">
                <div className="flex items-start gap-2.5">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#172c27]">
                    <span className="text-[9px] font-bold text-white">AI</span>
                  </div>
                  <div className="max-w-[85%] rounded-2xl rounded-tl-none bg-[#f2f5f0] px-3.5 py-2.5 text-[12.5px] text-[#17211f]">
                    <p>Hi! 👋 I&apos;m your shopping assistant. I can help you find products, check availability, or answer any questions.</p>
                    {isSignedIn && (
                      <p className="mt-1 text-[10px] text-[#526c3a]">✦  👋 LEATHER MART 313</p>
                    )}
                    <p className="mt-1 text-[#68736b]">What can I help you with today?</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 pl-8">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => void sendMessage(s)}
                      className="rounded-full border border-[#dce3d8] bg-white px-3 py-1.5 text-[11px] font-medium text-[#4a5a4d] transition-colors hover:border-[#9aad8e] hover:bg-[#f2f5f0]"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((m) => (
              <div key={m.id} className={`flex items-start gap-2.5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${
                  m.role === 'user' ? 'bg-[#edf3e7] text-[#526c3a]' : 'bg-[#172c27] text-white'
                }`}>
                  {m.role === 'user' ? 'You' : 'AI'}
                </div>

                <div className={`min-w-0 max-w-[84%] flex flex-col gap-2 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`w-full rounded-2xl px-3.5 py-2.5 text-[12.5px] leading-relaxed ${
                    m.role === 'user'
                      ? 'rounded-tr-none bg-[#172c27] text-white'
                      : 'rounded-tl-none bg-[#f2f5f0] text-[#17211f]'
                  }`}>
                    {m.role === 'assistant' ? renderMarkdown(m.content) : m.content}
                  </div>

                  {m.role === 'assistant' && m.products && m.products.length > 0 && (
                    <div className="w-full space-y-1.5">
                      {m.products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex items-start gap-2.5">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#172c27] text-[9px] font-bold text-white">
                  AI
                </div>
                <div className="flex items-center gap-1 rounded-2xl rounded-tl-none bg-[#f2f5f0] px-4 py-3">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#9aad8e]"
                      style={{ animationDelay: `${i * 150}ms` }} />
                  ))}
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-center text-[11px] text-red-600">
                Something went wrong. Please try again.
              </p>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit}
            className="flex items-center gap-2 border-t border-[#e8ece6] bg-[#fbfcfa] p-3"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about products, sizes, prices…"
              disabled={isLoading}
              className="flex-1 rounded-full border border-[#dce3d8] bg-white px-4 py-2 text-[12.5px] text-[#17211f] placeholder:text-[#b0b8ae] outline-none focus:border-[#9aad8e] disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              aria-label="Send message"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#172c27] text-white transition-colors hover:bg-[#27483d] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
