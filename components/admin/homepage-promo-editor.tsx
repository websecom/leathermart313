'use client';

import type { HomepageContent, HomepagePromo } from 'lib/catalog-storage';
import { useRouter } from 'next/navigation';
import type { ChangeEventHandler, Dispatch, SetStateAction } from 'react';
import { useState } from 'react';

const inputClass =
  'w-full rounded-lg border border-[#dce3da] bg-white px-3 py-2.5 text-[12px] text-[#17211f] outline-none focus:border-[#9aad8e]';

function applyPromoUpdate(
  update: SetStateAction<HomepagePromo>,
  promo: HomepagePromo
): HomepagePromo {
  return typeof update === 'function' ? update(promo) : update;
}

export default function HomepagePromoEditor({
  initialContent,
  databaseConfigured
}: {
  initialContent: HomepageContent;
  databaseConfigured: boolean;
}) {
  const router = useRouter();
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/admin/homepage-promo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content)
      });
      const result = (await response.json()) as { error?: string; saved?: boolean };
      if (!response.ok || !result.saved) {
        setError(result.error || 'Could not save homepage promotion settings.');
        if (response.status === 401) router.refresh();
        return;
      }
      setMessage('All three offer cards and the animated banner have been published.');
      router.refresh();
    } catch {
      setError('Could not reach the save service. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section
      id="homepage-content"
      aria-labelledby="homepage-promo-title"
      className="mb-8 overflow-hidden rounded-2xl border border-[#e1e7de] bg-[#fbfcfa]"
    >
      <div className="border-b border-[#e8ece6] px-5 py-5 sm:px-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#607b4a]">
          Homepage content
        </p>
        <h2 id="homepage-promo-title" className="mt-1 text-lg font-semibold text-[#17211f]">
          Animated cards & banner
        </h2>
        <p className="mt-1 text-[12px] leading-5 text-[#788179]">
          Update each animated offer card and the scrolling deals banner. Save all four together.
        </p>
      </div>

      {!databaseConfigured ? (
        <p className="mx-5 mt-5 rounded-lg border border-[#e4d7aa] bg-[#fbf7e9] px-4 py-3 text-[12px] leading-5 text-[#6c5b2c] sm:mx-6">
          Configure Supabase and apply the homepage content migration to save changes persistently.
          The displayed values are defaults until then.
        </p>
      ) : null}

      <form onSubmit={save} className="space-y-6 p-5 sm:p-6">
        {content.cards.map((card, index) => (
          <PromoFields
            key={`card-${index}`}
            title={`Animated offer card ${index + 1}`}
            promo={card}
            onChange={(update) =>
              setContent((current) => ({
                ...current,
                cards: [
                  index === 0 ? applyPromoUpdate(update, current.cards[0]) : current.cards[0],
                  index === 1 ? applyPromoUpdate(update, current.cards[1]) : current.cards[1],
                  index === 2 ? applyPromoUpdate(update, current.cards[2]) : current.cards[2]
                ]
              }))
            }
          />
        ))}
        <PromoFields
          title="Scrolling animated banner"
          promo={content.banner}
          onChange={(update) =>
            setContent((current) => ({
              ...current,
              banner: applyPromoUpdate(update, current.banner)
            }))
          }
          banner
        />

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
        <button
          type="submit"
          disabled={!databaseConfigured || saving}
          className="rounded-full bg-[#172c27] px-5 py-2.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#27483d] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save all homepage promotions'}
        </button>
      </form>
    </section>
  );
}

function PromoFields({
  title,
  promo,
  onChange,
  banner = false
}: {
  title: string;
  promo: HomepagePromo;
  onChange: Dispatch<SetStateAction<HomepagePromo>>;
  banner?: boolean;
}) {
  const textFields: { field: keyof HomepagePromo; label: string }[] = banner
    ? [
        { field: 'badgeTop', label: 'First marquee phrase' },
        { field: 'badgeBottom', label: 'Second marquee phrase' },
        { field: 'description', label: 'Supporting banner text' },
        { field: 'buttonLabel', label: 'Button label' },
        { field: 'href', label: 'Button link (site path)' }
      ]
    : [
        { field: 'badgeTop', label: 'Badge top line' },
        { field: 'badgeBottom', label: 'Badge bottom line' },
        { field: 'eyebrow', label: 'Eyebrow text' },
        { field: 'headline', label: 'Headline' },
        { field: 'description', label: 'Supporting text' },
        { field: 'buttonLabel', label: 'Button label' },
        { field: 'href', label: 'Button link (site path)' }
      ];

  return (
    <fieldset className="grid gap-5 rounded-xl border border-[#e1e7de] bg-white p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_220px]">
      <div className="space-y-4">
        <legend className="px-2 text-[14px] font-semibold text-[#17211f]">{title}</legend>
        <div>
          <label
            htmlFor={`${title}-image`}
            className="mb-1.5 block text-[12px] font-medium text-[#59645b]"
          >
            Background image URL (public HTTPS)
          </label>
          <input
            id={`${title}-image`}
            type="url"
            required
            maxLength={2048}
            value={promo.imageUrl}
            onChange={(event) =>
              onChange((current) => ({ ...current, imageUrl: event.target.value }))
            }
            className={inputClass}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {textFields.map(({ field, label }) => (
            <TextField
              key={field}
              label={label}
              id={`${title}-${field}`}
              value={promo[field] as string}
              onChange={(event) =>
                onChange((current) => ({ ...current, [field]: event.target.value }))
              }
            />
          ))}
          {!banner ? (
            <div>
              <label
                htmlFor={`${title}-discount`}
                className="mb-1.5 block text-[12px] font-medium text-[#59645b]"
              >
                Discount percentage
              </label>
              <input
                id={`${title}-discount`}
                type="number"
                min="0"
                max="100"
                step="1"
                required
                value={promo.discountPercent}
                onChange={(event) =>
                  onChange((current) => ({
                    ...current,
                    discountPercent: Number(event.target.value)
                  }))
                }
                className={inputClass}
              />
            </div>
          ) : null}
        </div>
        <p className="text-[11px] leading-5 text-[#788179]">
          Use a public HTTPS image URL and an internal destination such as /search. Uploads are not
          enabled.
        </p>
      </div>

      <aside
        aria-label={`${title} preview`}
        className="relative min-h-56 overflow-hidden rounded-xl bg-cover bg-center"
        style={{ backgroundImage: `url("${promo.imageUrl.replaceAll('"', '%22')}")` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/10 to-black/80" />
        {!banner ? (
          <span className="absolute right-4 top-4 flex h-16 w-16 rotate-6 flex-col items-center justify-center rounded-full bg-[#c6f36b] text-center text-[10px] font-bold uppercase text-[#17211f]">
            {promo.badgeTop}
            <span>
              {promo.discountPercent > 0 ? `${promo.discountPercent}%` : promo.badgeBottom}
            </span>
          </span>
        ) : null}
        <div className="absolute inset-x-4 bottom-4 text-white">
          <p className="text-[9px] font-semibold uppercase tracking-wide">
            {banner ? promo.badgeTop : promo.eyebrow}
          </p>
          <p className="mt-1 text-xl font-black">{banner ? promo.badgeBottom : promo.headline}</p>
          <p className="mt-1 text-[11px]">{promo.description}</p>
          <p className="mt-3 inline-flex rounded-full bg-[#172c27] px-3 py-2 text-[10px] font-semibold">
            {promo.buttonLabel}
            {promo.discountPercent > 0 ? ` · ${promo.discountPercent}% off` : ''}
          </p>
        </div>
      </aside>
    </fieldset>
  );
}

function TextField({
  label,
  id,
  value,
  onChange
}: {
  label: string;
  id: string;
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[12px] font-medium text-[#59645b]">
        {label}
      </label>
      <input
        id={id}
        required
        maxLength={id.endsWith('-href') ? 256 : 180}
        value={value}
        onChange={onChange}
        className={inputClass}
      />
    </div>
  );
}
