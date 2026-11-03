'use client';

import { useState } from 'react';

export default function SeedEmbeddingsButton({ initialCount }: { initialCount: number }) {
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function seed() {
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const res = await fetch('/api/admin/seed-embeddings', { method: 'POST' });
      const data = (await res.json()) as { success?: boolean; seeded?: number; total?: number; error?: string };
      if (!res.ok || !data.success) {
        setError(data.error ?? 'Seeding failed.');
        return;
      }
      setCount(data.seeded ?? 0);
      setMessage(`✓ ${data.seeded} of ${data.total} products embedded. Vector search is ready.`);
    } catch {
      setError('Could not reach the server.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mb-8 overflow-hidden rounded-2xl border border-[#e1e7de] bg-[#fbfcfa]">
      <div className="border-b border-[#e8ece6] px-5 py-5 sm:px-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#607b4a]">
          Agentic RAG
        </p>
        <h2 className="mt-1 text-lg font-semibold text-[#17211f]">Vector search embeddings</h2>
        <p className="mt-1 text-[12px] leading-5 text-[#788179]">
          Generate semantic embeddings for all products and store them in Supabase pgvector.
          The chatbot will use vector search to find relevant products instead of scanning the whole catalog.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${count > 0 ? 'bg-[#7ba747]' : 'bg-[#c6a747]'}`} />
            <span className="text-[13px] font-medium text-[#17211f]">
              {count > 0 ? `${count} products indexed` : 'Not yet seeded'}
            </span>
          </div>
          {count > 0 && (
            <p className="text-[11px] text-[#68736b]">
              Vector search active — chatbot uses semantic search.
            </p>
          )}
          {count === 0 && (
            <p className="text-[11px] text-[#a33e30]">
              Run the SQL migration first, then click Seed to activate vector search.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => void seed()}
          disabled={loading}
          className="rounded-full bg-[#172c27] px-5 py-2.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#27483d] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Generating embeddings…' : count > 0 ? 'Re-seed embeddings' : 'Seed embeddings'}
        </button>
      </div>
      {message && (
        <p className="border-t border-[#e8ece6] px-5 py-3 text-[12px] text-[#526c3a] sm:px-6">{message}</p>
      )}
      {error && (
        <p className="border-t border-[#e8ece6] px-5 py-3 text-[12px] text-[#a33e30] sm:px-6">{error}</p>
      )}
    </section>
  );
}
