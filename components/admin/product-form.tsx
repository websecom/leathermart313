'use client';

import type { Collection, Product, Image as ProductImage } from 'lib/types';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

/* ── Shared input styles ─────────────────────────── */
const input =
  'w-full rounded-lg border border-[#dce3da] bg-white px-3 py-2.5 text-[13px] text-[#17211f] outline-none focus:border-[#9aad8e] focus:ring-1 focus:ring-[#9aad8e]/30 disabled:opacity-50';

const sectionCard = 'rounded-2xl border border-[#e1e7de] bg-[#fbfcfa] overflow-hidden';
const sectionHead = 'border-b border-[#e8ece6] px-5 py-4 sm:px-6';
const sectionBody = 'p-5 sm:p-6';

/* ── Image helpers ───────────────────────────────── */
const maxImages = 10;
const maxSourceBytes = 20 * 1024 * 1024;
const maxOutputBytes = 8 * 1024 * 1024;
const maxDimension = 2400;
const acceptedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

function convertToWebp(file: File): Promise<{ file: File; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    if (!acceptedTypes.has(file.type)) {
      reject(new Error('Choose a JPEG, PNG, WebP, or AVIF image.'));
      return;
    }
    if (file.size > maxSourceBytes) {
      reject(new Error('Each image must be 20 MB or smaller.'));
      return;
    }
    createImageBitmap(file)
      .then((bitmap) => {
        const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
        const w = Math.max(1, Math.round(bitmap.width * scale));
        const h = Math.max(1, Math.round(bitmap.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) { bitmap.close(); reject(new Error('Canvas unavailable.')); return; }
        ctx.drawImage(bitmap, 0, 0, w, h);
        bitmap.close();
        canvas.toBlob(
          (blob) => {
            if (!blob) { reject(new Error('Could not compress image.')); return; }
            if (blob.size > maxOutputBytes) { reject(new Error('Optimized image exceeds 8 MB.')); return; }
            resolve({
              file: new File([blob], file.name.replace(/\.[^.]+$/, '') + '.webp', {
                type: 'image/webp', lastModified: Date.now()
              }),
              width: w, height: h
            });
          },
          'image/webp', 0.82
        );
      })
      .catch(() => reject(new Error('Could not open image.')));
  });
}

/* ── Component ───────────────────────────────────── */
export default function ProductForm({
  product,
  collections,
  databaseConfigured,
  b2StorageConfigured
}: {
  product: Product;
  collections: Collection[];
  databaseConfigured: boolean;
  b2StorageConfigured: boolean;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  /* ── Form state ── */
  const [title, setTitle] = useState(product.title);
  const [description, setDescription] = useState(product.description);
  const [price, setPrice] = useState(product.priceRange.minVariantPrice.amount);
  const [compareAt, setCompareAt] = useState(() => {
    const ca = product.priceRange.minCompareAtPrice.amount;
    return Number(ca) > Number(product.priceRange.minVariantPrice.amount) ? ca : '';
  });
  const [couponCode, setCouponCode] = useState('');

  /* ── Discount calculator state ── */
  const [discountType, setDiscountType] = useState<'percent' | 'amount'>('percent');
  const [discountValue, setDiscountValue] = useState('');

  /* ── Image state ── */
  const [images, setImages] = useState<ProductImage[]>(product.images);
  const [urlInput, setUrlInput] = useState('');
  const [uploadProgress, setUploadProgress] = useState('');
  const [uploading, setUploading] = useState(false);

  /* ── Inventory state: variantId → quantity ── */
  const [inventory, setInventory] = useState<Record<string, number>>(() =>
    Object.fromEntries(product.variants.map((v) => [v.id, v.inventoryQuantity]))
  );

  /* ── Status ── */
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  /* Reset when product changes */
  useEffect(() => {
    setTitle(product.title);
    setDescription(product.description);
    setPrice(product.priceRange.minVariantPrice.amount);
    const ca = product.priceRange.minCompareAtPrice.amount;
    setCompareAt(Number(ca) > Number(product.priceRange.minVariantPrice.amount) ? ca : '');
    setImages(product.images);
    setInventory(Object.fromEntries(product.variants.map((v) => [v.id, v.inventoryQuantity])));
    setMessage('');
    setError('');
    setUrlInput('');
    setUploadProgress('');
    setCouponCode('');
    setDiscountValue('');
    setDiscountType('percent');
  }, [product.id]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Derived data ── */
  const colors = product.options.find((o) => o.name.toLowerCase() === 'color')?.values ?? [];
  const sizes = product.options.find((o) => o.name.toLowerCase() === 'size')?.values ?? [];
  const totalUnits = Object.values(inventory).reduce((s, q) => s + q, 0);
  // Only disable save-related actions when session/db not ready
  const saveDisabled = !databaseConfigured || saving;
  // Image URL paste works regardless of session (local state only)
  const urlDisabled = images.length >= maxImages;
  // File upload needs B2 configured
  const uploadDisabled = !b2StorageConfigured || uploading || images.length >= maxImages;
  // Text/inventory fields are always editable (gated at save time)
  const disabled = saving;

  /* ── Image: add by URL ── */
  function addImageUrl() {
    const url = urlInput.trim();
    if (!url) return;
    if (images.length >= maxImages) { setError(`Maximum ${maxImages} images allowed.`); return; }
    try { new URL(url); } catch { setError('Enter a valid image URL.'); return; }
    if (!url.startsWith('https://')) { setError('Image URL must start with https://'); return; }
    // Warn if using a private B2 download API URL instead of the public friendly URL
    if (url.includes('b2api/v1/b2_download_file_by_id') || url.includes('b2api/v2/b2_download_file_by_id')) {
      setError(
        'This is a private B2 URL — it requires authentication and will show a 401 error. ' +
        'Use the Friendly URL instead: https://f005.backblazeb2.com/file/ecomwebs/your-image.jpg'
      );
      return;
    }    setImages((prev) => [
      ...prev,
      { url, altText: title, width: 1200, height: 1200 }
    ]);
    setUrlInput('');
    setError('');
  }

  /* ── Image: upload files ── */
  async function uploadFiles(files: File[]) {
    if (!files.length) return;
    if (images.length + files.length > maxImages) {
      setError(`Only ${maxImages - images.length} more image(s) can be added.`);
      return;
    }
    setUploading(true);
    setError('');
    let current = [...images];
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]!;
        setUploadProgress(`Optimising ${i + 1}/${files.length}…`);
        const optimized = await convertToWebp(file);
        setUploadProgress(`Uploading ${i + 1}/${files.length}…`);
        const authRes = await fetch(
          `/api/admin/products/${encodeURIComponent(product.id)}/image-upload`,
          { method: 'POST' }
        );
        const auth = (await authRes.json()) as { error?: string; uploadUrl?: string; key?: string; url?: string };
        if (!authRes.ok || !auth.uploadUrl || !auth.key || !auth.url) {
          throw new Error(auth.error ?? 'Could not authorize upload.');
        }
        const put = await fetch(auth.uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'public, max-age=31536000, immutable' },
          body: optimized.file
        });
        if (!put.ok) throw new Error(`B2 rejected upload (HTTP ${put.status}).`);
        current = [...current, {
          url: auth.url,
          storageKey: auth.key,
          altText: title,
          width: optimized.width,
          height: optimized.height
        }];
        setImages([...current]);
      }
      setUploadProgress(`${files.length} image(s) uploaded. Save to publish.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  function makeCover(index: number) {
    setImages((prev) => {
      const next = [...prev];
      const [item] = next.splice(index, 1);
      if (item) next.unshift(item);
      return next;
    });
  }

  /* ── Save ── */
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    if (images.length === 0) { setError('Add at least one product image.'); return; }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const inventoryQuantities = Object.fromEntries(
        product.variants.map((v) => [v.id, inventory[v.id] ?? 0])
      );
      const res = await fetch(`/api/admin/products/${encodeURIComponent(product.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          priceAmount: Number(price).toFixed(2),
          compareAtAmount: compareAt ? Number(compareAt).toFixed(2) : '',
          inventoryQuantities,
          images,
          couponCode: couponCode.trim() || undefined
        })
      });
      const result = (await res.json()) as { error?: string; saved?: boolean; cleanupWarning?: string };
      if (!res.ok || !result.saved) {
        setError(result.error ?? 'Could not save product.');
        if (res.status === 401) router.refresh();
        return;
      }
      setMessage(result.cleanupWarning ?? 'Product saved and published to the storefront.');
      router.refresh();
    } catch {
      setError('Could not reach the server. Check your connection.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-6">

      {/* ── Product info ── */}
      <div className={sectionCard}>
        <div className={sectionHead}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#607b4a]">
            Basic info
          </p>
          <h2 className="mt-0.5 text-[15px] font-semibold text-[#17211f]">{product.title}</h2>
        </div>
        <div className={`${sectionBody} grid gap-4 sm:grid-cols-2`}>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-[12px] font-medium text-[#59645b]">Product name</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={160}
              required
              disabled={disabled}
              className={input}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[#59645b]">
              Selling price (USD)
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-[#8a928b]">$</span>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                min="0.01"
                step="0.01"
                required
                disabled={disabled}
                className={`${input} pl-7`}
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[#59645b]">
              Original / compare-at price
              <span className="ml-1.5 text-[10px] font-normal text-[#8a928b]">(optional — shown as strikethrough)</span>
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-[#8a928b]">$</span>
              <input
                type="number"
                value={compareAt}
                onChange={(e) => setCompareAt(e.target.value)}
                min="0"
                step="0.01"
                disabled={disabled}
                placeholder="Leave blank for no discount"
                className={`${input} pl-7`}
              />
            </div>
          </div>
          <div className="sm:col-span-2">
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-[12px] font-medium text-[#59645b]">Description</label>
              <button
                type="button"
                disabled={!title.trim() || disabled}
                onClick={async () => {
                  setError('');
                  try {
                    const res = await fetch('/api/admin/ai-description', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        title,
                        productType: product.productType,
                        material: product.material
                      })
                    });
                    const data = (await res.json()) as { description?: string; error?: string };
                    if (!res.ok || !data.description) {
                      setError(data.error ?? 'AI generation failed.');
                      return;
                    }
                    setDescription(data.description);
                  } catch {
                    setError('Could not reach the AI service.');
                  }
                }}
                className="flex items-center gap-1.5 rounded-full border border-[#dce3da] bg-white px-3 py-1 text-[10px] font-medium text-[#4a6e2a] transition-colors hover:border-[#9aad8e] hover:bg-[#edf3e7] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span>✦</span> Generate with AI
              </button>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={5000}
              required
              disabled={disabled}
              className={`${input} resize-none`}
            />
          </div>
        </div>
      </div>

      {/* ── Pricing & Discounts ── */}
      <div className={sectionCard}>
        <div className={sectionHead}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#607b4a]">
            Pricing & discounts
          </p>
          <h2 className="mt-0.5 text-[15px] font-semibold text-[#17211f]">Discount & coupon</h2>
        </div>
        <div className={sectionBody}>

          {/* ── Quick discount calculator ── */}
          <div className="mb-5 rounded-xl border border-[#e1e7de] bg-white p-4">
            <p className="mb-3 text-[12px] font-semibold text-[#17211f]">Quick discount calculator</p>
            <p className="mb-3 text-[11px] text-[#788179]">
              Set a discount and it will auto-fill the &quot;Original price&quot; (compare-at) field above.
            </p>
            <div className="flex flex-wrap items-end gap-3">
              {/* Type selector */}
              <div className="flex rounded-lg border border-[#dce3da] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setDiscountType('percent')}
                  className={`px-3 py-2 text-[12px] font-semibold transition-colors ${discountType === 'percent' ? 'bg-[#172c27] text-white' : 'bg-white text-[#59645b] hover:bg-[#f2f5f0]'}`}
                >
                  % off
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountType('amount')}
                  className={`px-3 py-2 text-[12px] font-semibold transition-colors ${discountType === 'amount' ? 'bg-[#172c27] text-white' : 'bg-white text-[#59645b] hover:bg-[#f2f5f0]'}`}
                >
                  ₹ off
                </button>
              </div>

              {/* Value input */}
              <div className="relative w-32">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-[#8a928b]">
                  {discountType === 'percent' ? '%' : '₹'}
                </span>
                <input
                  type="number"
                  min={0.01}
                  step={discountType === 'percent' ? 1 : 0.01}
                  max={discountType === 'percent' ? 100 : undefined}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder={discountType === 'percent' ? '20' : '50'}
                  className={`${input} pl-7`}
                />
              </div>

              {/* Apply button */}
              <button
                type="button"
                disabled={!discountValue || Number(discountValue) <= 0 || !price}
                onClick={() => {
                  const sellingPrice = Number(price);
                  if (!sellingPrice) return;
                  let originalPrice: number;
                  if (discountType === 'percent') {
                    const pct = Math.min(Number(discountValue), 99.99);
                    originalPrice = sellingPrice / (1 - pct / 100);
                  } else {
                    originalPrice = sellingPrice + Number(discountValue);
                  }
                  setCompareAt(originalPrice.toFixed(2));
                  setDiscountValue('');
                }}
                className="rounded-lg bg-[#172c27] px-4 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-[#27483d] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Apply to compare-at price
              </button>
            </div>

            {/* Live preview */}
            {compareAt && Number(compareAt) > Number(price) && (
              <div className="mt-3 flex items-center gap-3 rounded-lg bg-[#edf3e7] px-3 py-2">
                <span className="text-[12px] text-[#8a928b] line-through">
                  ${Number(compareAt).toFixed(2)}
                </span>
                <span className="text-[13px] font-bold text-[#17211f]">
                  ${Number(price).toFixed(2)}
                </span>
                <span className="rounded-full bg-[#172c27] px-2 py-0.5 text-[10px] font-bold text-white">
                  {Math.round(((Number(compareAt) - Number(price)) / Number(compareAt)) * 100)}% OFF
                </span>
                <button
                  type="button"
                  onClick={() => setCompareAt('')}
                  className="ml-auto text-[10px] text-[#788179] underline hover:text-[#9a392d]"
                >
                  Remove discount
                </button>
              </div>
            )}
          </div>

          {/* ── Coupon code ── */}
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[#59645b]">
              Linked coupon code
              <span className="ml-1.5 text-[10px] font-normal text-[#8a928b]">(optional)</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="e.g. SAVE20"
                disabled={disabled}
                className={`${input} flex-1 font-mono uppercase`}
                maxLength={32}
              />
              {couponCode && (
                <button
                  type="button"
                  onClick={() => setCouponCode('')}
                  className="rounded-lg border border-[#dce3da] px-3 py-2 text-[11px] text-[#788179] hover:bg-[#f2f5f0]"
                >
                  Clear
                </button>
              )}
            </div>
            <p className="mt-1.5 text-[10px] leading-4 text-[#8a928b]">
              Attach an existing coupon code to this product. Customers see it on the checkout page as a suggested discount.
              Create coupon codes at{' '}
              <a href="/admin/coupons" className="text-[#4a6e2a] underline">Admin → Coupons</a>.
            </p>
          </div>
        </div>
      </div>

      {/* ── Images ── */}
      <div className={sectionCard}>
        <div className={sectionHead}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#607b4a]">
            Product images
          </p>
          <p className="mt-1 text-[12px] text-[#788179]">
            First image is the cover. Paste a URL or upload from your device. Up to {maxImages} images.
          </p>
        </div>
        <div className={sectionBody}>

          {/* Paste URL row */}
          <div className="flex gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addImageUrl(); } }}
              placeholder="https://leathermart313.s3.fr-par.scw.cloud/image.jpg"
              disabled={urlDisabled}
              className={`${input} flex-1`}
            />
            <button
              type="button"
              onClick={addImageUrl}
              disabled={urlDisabled || !urlInput.trim()}
              className="rounded-lg border border-[#dce3da] bg-white px-4 py-2.5 text-[12px] font-medium text-[#334239] transition-colors hover:border-[#9aad8e] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add URL
            </button>
          </div>
          <p className="mt-1.5 text-[11px] text-[#8a928b]">
            In Scaleway: click your file in the bucket → copy the public URL. Format: <strong className="text-[#59645b]">https://leathermart313.s3.fr-par.scw.cloud/filename.jpg</strong>
          </p>

          {/* Upload button */}
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploadDisabled}
              className="rounded-lg border border-[#dce3da] bg-white px-4 py-2.5 text-[12px] font-medium text-[#334239] transition-colors hover:border-[#9aad8e] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploading ? 'Uploading…' : '↑ Upload from device'}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              multiple
              className="sr-only"
              onChange={(e) => {
                const files = Array.from(e.currentTarget.files ?? []);
                e.currentTarget.value = '';
                void uploadFiles(files);
              }}
            />
          {!b2StorageConfigured && (
              <span className="text-[11px] text-[#a33e30]">B2 not configured — use URL paste instead</span>
            )}
            {uploadProgress && (
              <span className="text-[11px] text-[#526c3a]">{uploadProgress}</span>
            )}
          </div>

          {/* Image grid */}
          {images.length > 0 && (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {images.map((img, i) => (
                <div
                  key={img.storageKey ?? img.url}
                  className="group relative overflow-hidden rounded-xl border border-[#e1e7de] bg-white"
                >
                  <div className="relative aspect-square bg-[#f2e8d9]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={img.altText}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent && !parent.querySelector('.img-error')) {
                          const err = document.createElement('div');
                          err.className = 'img-error absolute inset-0 flex flex-col items-center justify-center gap-1 p-2 text-center';
                          err.innerHTML = '<span style="font-size:1.5rem">🖼</span><span style="font-size:10px;color:#a33e30;line-height:1.3">Image not loading.<br/>Check the URL is public.</span>';
                          parent.appendChild(err);
                        }
                      }}
                    />
                  </div>
                  {i === 0 && (
                    <span className="absolute left-2 top-2 rounded-full bg-[#172c27] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-white">
                      Cover
                    </span>
                  )}
                  {/* Actions overlay */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    {i !== 0 && (
                      <button
                        type="button"
                        onClick={() => makeCover(i)}
                        disabled={disabled}
                        className="rounded-full bg-white px-3 py-1 text-[10px] font-semibold text-[#17211f] hover:bg-[#c6f36b]"
                      >
                        Make cover
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      disabled={disabled}
                      className="rounded-full bg-white px-3 py-1 text-[10px] font-semibold text-[#a33e30] hover:bg-[#fff1ed]"
                    >
                      Remove
                    </button>
                  </div>
                  {/* Alt text */}
                  <div className="border-t border-[#e1e7de] p-2">
                    <input
                      type="text"
                      value={img.altText}
                      maxLength={200}
                      placeholder="Alt text"
                      disabled={disabled}
                      onChange={(e) =>
                        setImages((prev) =>
                          prev.map((item, idx) =>
                            idx === i ? { ...item, altText: e.target.value } : item
                          )
                        )
                      }
                      className="w-full rounded border-0 bg-transparent text-[10px] text-[#59645b] outline-none placeholder:text-[#b0b8af] focus:ring-0 disabled:opacity-50"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Colors & Sizes info ── */}
      <div className={sectionCard}>
        <div className={sectionHead}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#607b4a]">
            Variants
          </p>
          <p className="mt-1 text-[12px] text-[#788179]">
            Colors and sizes are defined in the catalog. Adjust stock per variant below.
          </p>
        </div>
        <div className={`${sectionBody} space-y-4`}>
          {/* Color swatches */}
          {colors.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#68736b]">
                Colors ({colors.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => {
                  const colorUnits = product.variants
                    .filter((v) => v.selectedOptions.some((o) => o.name === 'Color' && o.value === color))
                    .reduce((s, v) => s + (inventory[v.id] ?? 0), 0);
                  return (
                    <span
                      key={color}
                      className={`rounded-full border px-3 py-1 text-[11px] font-medium ${
                        colorUnits > 0
                          ? 'border-[#c8ddb8] bg-[#edf3e7] text-[#304a2a]'
                          : 'border-[#f0c9c4] bg-[#fbefec] text-[#9a392d]'
                      }`}
                    >
                      {color} · {colorUnits}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Size swatches */}
          {sizes.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#68736b]">
                Sizes ({sizes.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => {
                  const sizeUnits = product.variants
                    .filter((v) => v.selectedOptions.some((o) => o.name === 'Size' && o.value === size))
                    .reduce((s, v) => s + (inventory[v.id] ?? 0), 0);
                  return (
                    <span
                      key={size}
                      className={`rounded-full border px-3 py-1 text-[11px] font-medium ${
                        sizeUnits > 0
                          ? 'border-[#c8ddb8] bg-[#edf3e7] text-[#304a2a]'
                          : 'border-[#f0c9c4] bg-[#fbefec] text-[#9a392d]'
                      }`}
                    >
                      {size} · {sizeUnits}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Inventory grid ── */}
      <div className={sectionCard}>
        <div className={sectionHead}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#607b4a]">
                Inventory
              </p>
              <p className="mt-1 text-[12px] text-[#788179]">
                Set stock quantity for each color / size combination.
              </p>
            </div>
            <span className="rounded-full border border-[#e1e7de] px-3 py-1.5 text-[12px] text-[#68736b]">
              {totalUnits.toLocaleString()} total units
            </span>
          </div>
        </div>
        <div className={sectionBody}>
          {/* Desktop: grid by color × size */}
          {colors.length > 0 && sizes.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr>
                    <th className="pb-3 pr-4 text-left font-semibold text-[#59645b]">Color</th>
                    {sizes.map((size) => (
                      <th key={size} className="pb-3 px-2 text-center font-semibold text-[#59645b]">
                        {size}
                      </th>
                    ))}
                    <th className="pb-3 pl-4 text-right font-semibold text-[#8a928b]">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f3ee]">
                  {colors.map((color) => {
                    const colorTotal = sizes.reduce((s, size) => {
                      const variant = product.variants.find(
                        (v) =>
                          v.selectedOptions.some((o) => o.name === 'Color' && o.value === color) &&
                          v.selectedOptions.some((o) => o.name === 'Size' && o.value === size)
                      );
                      return s + (variant ? (inventory[variant.id] ?? 0) : 0);
                    }, 0);
                    return (
                      <tr key={color}>
                        <td className="py-2.5 pr-4 font-medium text-[#334239]">{color}</td>
                        {sizes.map((size) => {
                          const variant = product.variants.find(
                            (v) =>
                              v.selectedOptions.some((o) => o.name === 'Color' && o.value === color) &&
                              v.selectedOptions.some((o) => o.name === 'Size' && o.value === size)
                          );
                          if (!variant) {
                            return <td key={size} className="px-2 text-center text-[#c0c8be]">—</td>;
                          }
                          const qty = inventory[variant.id] ?? 0;
                          return (
                            <td key={size} className="px-2 py-1.5">
                              <input
                                type="number"
                                value={qty}
                                min={0}
                                max={100000}
                                step={1}
                                disabled={disabled}
                                onChange={(e) =>
                                  setInventory((prev) => ({
                                    ...prev,
                                    [variant.id]: Math.max(0, parseInt(e.target.value, 10) || 0)
                                  }))
                                }
                                className={`w-16 rounded-lg border text-center text-[12px] py-1.5 outline-none transition-colors ${
                                  qty === 0
                                    ? 'border-[#f0c9c4] bg-[#fff8f7] text-[#9a392d] focus:border-[#e8a9a0]'
                                    : qty <= 5
                                    ? 'border-[#f0ddb0] bg-[#fffbf0] text-[#7a6020] focus:border-[#d4b060]'
                                    : 'border-[#dce3da] bg-white text-[#17211f] focus:border-[#9aad8e]'
                                } disabled:opacity-50`}
                              />
                            </td>
                          );
                        })}
                        <td className={`py-2.5 pl-4 text-right font-semibold ${colorTotal === 0 ? 'text-[#9a392d]' : 'text-[#334239]'}`}>
                          {colorTotal}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-[#e1e7de]">
                    <td className="pt-3 pr-4 font-semibold text-[#334239]">Total</td>
                    {sizes.map((size) => {
                      const sizeTotal = colors.reduce((s, color) => {
                        const variant = product.variants.find(
                          (v) =>
                            v.selectedOptions.some((o) => o.name === 'Color' && o.value === color) &&
                            v.selectedOptions.some((o) => o.name === 'Size' && o.value === size)
                        );
                        return s + (variant ? (inventory[variant.id] ?? 0) : 0);
                      }, 0);
                      return (
                        <td key={size} className={`pt-3 px-2 text-center font-semibold ${sizeTotal === 0 ? 'text-[#9a392d]' : 'text-[#334239]'}`}>
                          {sizeTotal}
                        </td>
                      );
                    })}
                    <td className="pt-3 pl-4 text-right font-bold text-[#17211f]">{totalUnits}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            /* Fallback: simple list for products without color/size */
            <div className="space-y-2">
              {product.variants.map((variant) => {
                const qty = inventory[variant.id] ?? 0;
                return (
                  <div key={variant.id} className="flex items-center justify-between gap-4 rounded-lg border border-[#e1e7de] bg-white px-4 py-2.5">
                    <span className="text-[13px] font-medium text-[#334239]">{variant.title}</span>
                    <input
                      type="number"
                      value={qty}
                      min={0}
                      max={100000}
                      step={1}
                      disabled={disabled}
                      onChange={(e) =>
                        setInventory((prev) => ({
                          ...prev,
                          [variant.id]: Math.max(0, parseInt(e.target.value, 10) || 0)
                        }))
                      }
                      className={`w-24 rounded-lg border text-center text-[13px] py-2 outline-none ${
                        qty === 0 ? 'border-[#f0c9c4] bg-[#fff8f7] text-[#9a392d]' : 'border-[#dce3da] bg-white text-[#17211f]'
                      } disabled:opacity-50`}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick-set helpers */}
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#e8ece6] pt-4">
            <span className="text-[11px] text-[#8a928b]">Quick set all to:</span>
            {[0, 5, 10, 20, 50].map((val) => (
              <button
                key={val}
                type="button"
                disabled={disabled}
                onClick={() =>
                  setInventory(
                    Object.fromEntries(product.variants.map((v) => [v.id, val]))
                  )
                }
                className="rounded-full border border-[#dce3da] bg-white px-3 py-1 text-[11px] font-medium text-[#334239] transition-colors hover:border-[#9aad8e] hover:bg-[#edf3e7] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {val}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Collections info ── */}
      <div className={sectionCard}>
        <div className={`${sectionHead} flex items-center gap-3`}>
          <div className="flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#607b4a]">
              Collections
            </p>
            <p className="mt-1 text-[12px] text-[#788179]">
              This product appears in the following collections.
            </p>
          </div>
        </div>
        <div className={`${sectionBody} flex flex-wrap gap-2`}>
          {product.collectionHandles.map((handle) => {
            const col = collections.find((c) => c.handle === handle);
            return (
              <span
                key={handle}
                className="rounded-full border border-[#dce8c7] bg-[#f0f7e8] px-3 py-1 text-[12px] font-medium text-[#3d6423]"
              >
                {col?.title ?? handle}
              </span>
            );
          })}
        </div>
      </div>

      {/* ── Save bar ── */}
      <div className="sticky bottom-0 rounded-2xl border border-[#e1e7de] bg-white/95 px-5 py-4 shadow-[0_-4px_24px_rgba(23,44,39,0.08)] backdrop-blur-sm sm:px-6">
        {error && (
          <p role="alert" className="mb-3 rounded-lg border border-[#f0c9c4] bg-[#fff8f7] px-3 py-2.5 text-[12px] text-[#9a392d]">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="mb-3 rounded-lg border border-[#c8ddb8] bg-[#edf3e7] px-3 py-2.5 text-[12px] text-[#304a2a]">
            ✓ {message}
          </p>
        )}
        <div className="flex items-center justify-between gap-4">
          <div className="text-[11px] text-[#788179]">
            {!databaseConfigured ? (
              <span className="text-[#a33e30]">⚠ Supabase not configured — changes won't persist</span>
            ) : (
              <span>{product.variants.length} variants · {images.length} image(s)</span>
            )}
          </div>
          <button
            type="submit"
            disabled={disabled || images.length === 0}
            className="rounded-full bg-[#172c27] px-6 py-3 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-[#27483d] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save product'}
          </button>
        </div>
      </div>

    </form>
  );
}
