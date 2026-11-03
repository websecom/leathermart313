'use client';

import type { Collection } from 'lib/types';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const inputClass =
  'w-full rounded-lg border border-[#dce3da] bg-white px-3 py-2.5 text-[12px] text-[#17211f] outline-none focus:border-[#9aad8e]';

type EditState = {
  title: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
};

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

export default function CollectionManager({
  initialCollections,
  databaseConfigured
}: {
  initialCollections: Collection[];
  databaseConfigured: boolean;
}) {
  const router = useRouter();
  const [collections, setCollections] = useState<Collection[]>(initialCollections);
  const [editingHandle, setEditingHandle] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EditState>({ title: '', description: '', seoTitle: '', seoDescription: '' });
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const defaultHandles = new Set(initialCollections.map((c) => c.handle));

  function startEdit(collection: Collection) {
    setEditingHandle(collection.handle);
    setEditDraft({
      title: collection.title,
      description: collection.description,
      seoTitle: collection.seo?.title || '',
      seoDescription: collection.seo?.description || ''
    });
    setError('');
    setMessage('');
  }

  function cancelEdit() {
    setEditingHandle(null);
    setEditDraft({ title: '', description: '', seoTitle: '', seoDescription: '' });
  }

  async function saveEdit(collection: Collection) {
    if (!databaseConfigured) return;
    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/admin/collections', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          handle: collection.handle,
          title: editDraft.title,
          description: editDraft.description,
          seoTitle: editDraft.seoTitle,
          seoDescription: editDraft.seoDescription,
          hidden: collection.hidden || false,
          isCustom: !defaultHandles.has(collection.handle)
        })
      });
      const result = (await response.json()) as { error?: string; saved?: boolean };
      if (!response.ok || !result.saved) {
        setError(result.error || 'Could not save the category.');
        if (response.status === 401) router.refresh();
        return;
      }
      setCollections((prev) =>
        prev.map((c) =>
          c.handle === collection.handle
            ? {
                ...c,
                title: editDraft.title,
                description: editDraft.description,
                seo: {
                  title: editDraft.seoTitle || editDraft.title,
                  description: editDraft.seoDescription || editDraft.description
                }
              }
            : c
        )
      );
      setEditingHandle(null);
      setMessage(`"${editDraft.title}" has been updated.`);
      router.refresh();
    } catch {
      setError('Could not reach the save service. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleHidden(collection: Collection) {
    if (!databaseConfigured) return;
    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/admin/collections', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          handle: collection.handle,
          title: collection.title,
          description: collection.description,
          seoTitle: collection.seo?.title || collection.title,
          seoDescription: collection.seo?.description || collection.description,
          hidden: !collection.hidden,
          isCustom: !defaultHandles.has(collection.handle)
        })
      });
      const result = (await response.json()) as { error?: string; saved?: boolean };
      if (!response.ok || !result.saved) {
        setError(result.error || 'Could not update the category.');
        if (response.status === 401) router.refresh();
        return;
      }
      setCollections((prev) =>
        prev.map((c) =>
          c.handle === collection.handle ? { ...c, hidden: !c.hidden } : c
        )
      );
      setMessage(
        `"${collection.title}" is now ${collection.hidden ? 'visible' : 'hidden'}.`
      );
      router.refresh();
    } catch {
      setError('Could not reach the save service. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteCollection(collection: Collection) {
    if (!databaseConfigured) return;
    if (defaultHandles.has(collection.handle)) return;
    if (!confirm(`Delete "${collection.title}"? This cannot be undone.`)) return;

    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/admin/collections', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: collection.handle })
      });
      const result = (await response.json()) as { error?: string; deleted?: boolean };
      if (!response.ok || !result.deleted) {
        setError(result.error || 'Could not delete the category.');
        if (response.status === 401) router.refresh();
        return;
      }
      setCollections((prev) => prev.filter((c) => c.handle !== collection.handle));
      setMessage(`"${collection.title}" has been deleted.`);
      router.refresh();
    } catch {
      setError('Could not reach the delete service. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  }

  async function addCollection() {
    if (!newTitle.trim()) {
      setError('Enter a category name.');
      return;
    }
    if (!databaseConfigured) return;
    const handle = slugify(newTitle);
    if (collections.some((c) => c.handle === handle)) {
      setError(`A category with the handle "${handle}" already exists.`);
      return;
    }

    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/admin/collections', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          handle,
          title: newTitle.trim(),
          description: newDescription.trim(),
          seoTitle: newTitle.trim(),
          seoDescription: newDescription.trim(),
          hidden: false,
          isCustom: true
        })
      });
      const result = (await response.json()) as { error?: string; saved?: boolean };
      if (!response.ok || !result.saved) {
        setError(result.error || 'Could not create the category.');
        if (response.status === 401) router.refresh();
        return;
      }
      setCollections((prev) => [
        ...prev,
        {
          handle,
          title: newTitle.trim(),
          description: newDescription.trim(),
          seo: { title: newTitle.trim(), description: newDescription.trim() },
          updatedAt: new Date().toISOString(),
          path: `/search/${handle}`,
          hidden: false
        }
      ]);
      setNewTitle('');
      setNewDescription('');
      setMessage(`"${newTitle.trim()}" has been added.`);
      router.refresh();
    } catch {
      setError('Could not reach the save service. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section
      id="collections"
      aria-labelledby="collection-manager-title"
      className="mb-8 overflow-hidden rounded-2xl border border-[#e1e7de] bg-[#fbfcfa]"
    >
      {/* Header */}
      <div className="border-b border-[#e8ece6] px-5 py-5 sm:px-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#607b4a]">
          Categories
        </p>
        <h2 id="collection-manager-title" className="mt-1 text-lg font-semibold text-[#17211f]">
          Manage collections
        </h2>
        <p className="mt-1 text-[12px] leading-5 text-[#788179]">
          Add, edit, hide, or delete storefront categories. Default categories can be hidden but
          not deleted.
        </p>
      </div>

      {!databaseConfigured ? (
        <p className="mx-5 mt-5 rounded-lg border border-[#e4d7aa] bg-[#fbf7e9] px-4 py-3 text-[12px] leading-5 text-[#6c5b2c] sm:mx-6">
          Configure Supabase and apply the collections migration to save changes persistently.
        </p>
      ) : null}

      {/* ── Add new category ── */}
      <div className="border-b border-[#e8ece6] p-5 sm:p-6">
        <h3 className="mb-3 text-[14px] font-semibold text-[#17211f]">Add a new category</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="new-cat-title" className="mb-1.5 block text-[12px] font-medium text-[#59645b]">
              Category name
            </label>
            <input
              id="new-cat-title"
              type="text"
              maxLength={80}
              placeholder="e.g. Winter sale"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="new-cat-desc" className="mb-1.5 block text-[12px] font-medium text-[#59645b]">
              Description (optional)
            </label>
            <input
              id="new-cat-desc"
              type="text"
              maxLength={300}
              placeholder="A short tagline for this category"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={addCollection}
            disabled={!databaseConfigured || saving || !newTitle.trim()}
            className="rounded-full bg-[#172c27] px-4 py-2.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#27483d] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Saving…' : '+ Add category'}
          </button>
          {newTitle.trim() && (
            <span className="text-[11px] text-[#788179]">
              URL: <code className="rounded bg-[#f2f5f0] px-1.5 py-0.5 text-[#4a6e2a]">/search/{slugify(newTitle)}</code>
            </span>
          )}
        </div>
      </div>

      {/* ── Existing categories ── */}
      <div className="divide-y divide-[#e8ece6]">
        {collections.map((collection) => {
          const isDefault = defaultHandles.has(collection.handle);
          const isEditing = editingHandle === collection.handle;

          return (
            <div key={collection.handle} className="p-5 sm:p-6">
              {isEditing ? (
                /* ── Edit mode ── */
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-[12px] font-medium text-[#59645b]">
                        Title
                      </label>
                      <input
                        type="text"
                        maxLength={80}
                        value={editDraft.title}
                        onChange={(e) => setEditDraft((d) => ({ ...d, title: e.target.value }))}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[12px] font-medium text-[#59645b]">
                        Description
                      </label>
                      <input
                        type="text"
                        maxLength={300}
                        value={editDraft.description}
                        onChange={(e) => setEditDraft((d) => ({ ...d, description: e.target.value }))}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[12px] font-medium text-[#59645b]">
                        SEO title
                      </label>
                      <input
                        type="text"
                        maxLength={80}
                        value={editDraft.seoTitle}
                        onChange={(e) => setEditDraft((d) => ({ ...d, seoTitle: e.target.value }))}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[12px] font-medium text-[#59645b]">
                        SEO description
                      </label>
                      <input
                        type="text"
                        maxLength={160}
                        value={editDraft.seoDescription}
                        onChange={(e) => setEditDraft((d) => ({ ...d, seoDescription: e.target.value }))}
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => saveEdit(collection)}
                      disabled={saving}
                      className="rounded-full bg-[#172c27] px-4 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-[#27483d] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      disabled={saving}
                      className="rounded-full border border-[#dce3da] px-4 py-2 text-[12px] font-medium text-[#59645b] transition-colors hover:bg-[#f2f5f0] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* ── View mode ── */
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[14px] font-semibold text-[#17211f]">
                        {collection.title}
                      </h3>
                      {collection.hidden ? (
                        <span className="rounded-full bg-[#fff1ed] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-[#a33e30]">
                          Hidden
                        </span>
                      ) : (
                        <span className="rounded-full bg-[#edf3e7] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-[#526c3a]">
                          Visible
                        </span>
                      )}
                      {isDefault ? (
                        <span className="rounded-full border border-[#e1e7de] px-2 py-0.5 text-[9px] font-medium text-[#8a928b]">
                          Default
                        </span>
                      ) : (
                        <span className="rounded-full border border-[#dce8c7] bg-[#f5f8ef] px-2 py-0.5 text-[9px] font-medium text-[#607b4a]">
                          Custom
                        </span>
                      )}
                    </div>
                    {collection.description ? (
                      <p className="mt-1 text-[12px] leading-5 text-[#788179]">
                        {collection.description}
                      </p>
                    ) : null}
                    <p className="mt-1.5 text-[11px] text-[#8a928b]">
                      <code className="rounded bg-[#f2f5f0] px-1.5 py-0.5 text-[#4a6e2a]">
                        /search/{collection.handle}
                      </code>
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-none items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => startEdit(collection)}
                      disabled={!databaseConfigured || saving}
                      className="rounded-lg border border-[#dce3da] px-3 py-2 text-[11px] font-medium text-[#59645b] transition-colors hover:border-[#9aad8e] hover:bg-[#f2f5f0] disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label={`Edit ${collection.title}`}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleHidden(collection)}
                      disabled={!databaseConfigured || saving}
                      className="rounded-lg border border-[#dce3da] px-3 py-2 text-[11px] font-medium text-[#59645b] transition-colors hover:border-[#9aad8e] hover:bg-[#f2f5f0] disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label={collection.hidden ? `Show ${collection.title}` : `Hide ${collection.title}`}
                    >
                      {collection.hidden ? 'Show' : 'Hide'}
                    </button>
                    {!isDefault ? (
                      <button
                        type="button"
                        onClick={() => deleteCollection(collection)}
                        disabled={!databaseConfigured || saving}
                        className="rounded-lg border border-[#f0d5cf] px-3 py-2 text-[11px] font-medium text-[#a33e30] transition-colors hover:bg-[#fff1ed] disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label={`Delete ${collection.title}`}
                      >
                        Delete
                      </button>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Status messages */}
      <div className="px-5 pb-5 sm:px-6 sm:pb-6">
        {error ? (
          <p role="alert" className="text-[12px] text-[#a33e30]">
            {error}
          </p>
        ) : null}
        {message ? (
          <p role="status" className="text-[12px] text-[#526c3a]">
            {message}
          </p>
        ) : null}
      </div>
    </section>
  );
}
