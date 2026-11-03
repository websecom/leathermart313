'use client';

import type { Collection, Image as ProductImage, Product } from 'lib/types';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ProductImageManager from './product-image-manager';

export default function ProductEditor({
  products,
  collections,
  databaseConfigured,
  b2StorageConfigured
}: {
  products: Product[];
  collections: Collection[];
  databaseConfigured: boolean;
  b2StorageConfigured: boolean;
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(products[0]?.id || '');
  const [inventoryDraft, setInventoryDraft] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      (products[0]?.variants || []).map((variant) => [variant.id, variant.inventoryQuantity])
    )
  );
  const [imageDraft, setImageDraft] = useState<ProductImage[]>(products[0]?.images || []);
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryFilter, setInventoryFilter] = useState<'all' | 'low' | 'out'>('all');
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const selectedProduct = products.find((product) => product.id === selectedId);
  useEffect(() => {
    if (!selectedProduct) return;
    setInventoryDraft(
      Object.fromEntries(
        selectedProduct.variants.map((variant) => [variant.id, variant.inventoryQuantity])
      )
    );
    setImageDraft(selectedProduct.images);
  }, [selectedProduct]);
  const normalizedSearch = inventorySearch
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ');
  const colors =
    selectedProduct?.options.find((option) => option.name.toLowerCase() === 'color')?.values || [];
  const sizes =
    selectedProduct?.options.find((option) => option.name.toLowerCase() === 'size')?.values || [];
  const inventorySummary = (selectedProduct?.variants || []).reduce(
    (summary, variant) => {
      const quantity = inventoryDraft[variant.id] ?? 0;
      const color = variant.selectedOptions.find((option) => option.name.toLowerCase() === 'color')
        ?.value;
      const size = variant.selectedOptions.find((option) => option.name.toLowerCase() === 'size')
        ?.value;
      summary.totalUnits += quantity;
      if (quantity === 0) summary.outOfStockVariants += 1;
      if (color) {
        summary.colorUnits[color] = (summary.colorUnits[color] || 0) + quantity;
        const colorAvailability = summary.colorSizes[color] || { inStock: 0, total: 0 };
        colorAvailability.total += 1;
        if (quantity > 0) colorAvailability.inStock += 1;
        summary.colorSizes[color] = colorAvailability;
      }
      if (size) {
        summary.sizeUnits[size] = (summary.sizeUnits[size] || 0) + quantity;
        const sizeAvailability = summary.sizeColors[size] || { inStock: 0, total: 0 };
        sizeAvailability.total += 1;
        if (quantity > 0) sizeAvailability.inStock += 1;
        summary.sizeColors[size] = sizeAvailability;
      }
      return summary;
    },
    {
      totalUnits: 0,
      outOfStockVariants: 0,
      colorUnits: {} as Record<string, number>,
      sizeUnits: {} as Record<string, number>,
      colorSizes: {} as Record<string, { inStock: number; total: number }>,
      sizeColors: {} as Record<string, { inStock: number; total: number }>
    }
  );
  const visibleVariants = (selectedProduct?.variants || []).filter((variant) => {
    const quantity = inventoryDraft[variant.id] ?? 0;
    const variantSearch = [variant.title, ...variant.selectedOptions.map((option) => option.value)]
      .join(' ')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ');
    const matchesSearch = !normalizedSearch || variantSearch.includes(normalizedSearch);
    const matchesFilter =
      inventoryFilter === 'all' ||
      (inventoryFilter === 'low' && quantity > 0 && quantity <= 5) ||
      (inventoryFilter === 'out' && quantity === 0);
    return matchesSearch && matchesFilter;
  });

  async function saveProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProduct) return;

    const formData = new FormData(event.currentTarget);
    const inventoryQuantities = Object.fromEntries(
      selectedProduct.variants.map((variant) => [variant.id, inventoryDraft[variant.id]])
    );
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(
        `/api/admin/products/${encodeURIComponent(selectedProduct.id)}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: formData.get('title'),
            description: formData.get('description'),
            priceAmount: formData.get('priceAmount'),
            compareAtAmount: formData.get('compareAtAmount'),
            inventoryQuantities,
            images: imageDraft
          })
        }
      );
      const result = (await response.json()) as {
        error?: string;
        saved?: boolean;
        cleanupWarning?: string;
      };
      if (!response.ok || !result.saved) {
        setError(result.error || 'Could not save this product.');
        if (response.status === 401) router.refresh();
        return;
      }

      setMessage(
        result.cleanupWarning || 'Product saved. The storefront now uses the updated catalog data.'
      );
      router.refresh();
    } catch {
      setError('Could not reach the save service. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {!databaseConfigured ? (
        <div className="mx-5 mt-5 rounded-xl border border-[#e4d7aa] bg-[#fbf7e9] px-4 py-3 text-[13px] leading-6 text-[#6c5b2c] sm:mx-6">
          Connect Supabase and run the provided SQL setup before saving catalog changes. Until then,
          the storefront uses the sample catalog.
        </div>
      ) : null}

      <div className="space-y-6 p-4 sm:p-6">
        {collections.map((collection) => {
          const categoryProducts = products.filter((product) =>
            product.collectionHandles.includes(collection.handle)
          );
          if (!categoryProducts.length) return null;

          return (
            <section
              key={collection.handle}
              aria-labelledby={`inventory-category-${collection.handle}`}
              className="overflow-hidden rounded-xl border border-[#e3e9e1] bg-white"
            >
              <div className="flex items-center justify-between gap-3 border-b border-[#edf0eb] bg-[#f6f8f4] px-4 py-3.5 sm:px-5">
                <div>
                  <h3
                    id={`inventory-category-${collection.handle}`}
                    className="text-[12px] font-semibold text-[#27362e]"
                  >
                    {collection.title}
                  </h3>
                  <p className="mt-1 text-[12px] text-[#788179]">{collection.description}</p>
                </div>
                <span className="shrink-0 rounded-full bg-white px-3 py-1.5 text-[12px] text-[#68736b]">
                  {categoryProducts.length} {categoryProducts.length === 1 ? 'product' : 'products'}
                </span>
              </div>

              <div className="divide-y divide-[#edf0eb]">
                {categoryProducts.map((product) => {
                  const stock = product.variants.reduce(
                    (total, variant) => total + variant.inventoryQuantity,
                    0
                  );
                  const colorTotals = product.colors.map((color) => ({
                    color,
                    quantity: product.variants.reduce(
                      (total, variant) =>
                        total +
                        (variant.selectedOptions.some(
                          (option) =>
                            option.name.toLowerCase() === 'color' && option.value === color
                        )
                          ? variant.inventoryQuantity
                          : 0),
                      0
                    )
                  }));
                  const sizeTotals = product.sizes.map((size) => ({
                    size,
                    quantity: product.variants.reduce(
                      (total, variant) =>
                        total +
                        (variant.selectedOptions.some(
                          (option) => option.name.toLowerCase() === 'size' && option.value === size
                        )
                          ? variant.inventoryQuantity
                          : 0),
                      0
                    )
                  }));
                  const isSelected = product.id === selectedProduct?.id;

                  return (
                    <article
                      key={product.id}
                      className={`grid gap-4 p-4 sm:grid-cols-[64px_minmax(0,1fr)_auto] sm:items-start sm:gap-5 sm:px-5 ${
                        isSelected ? 'bg-[#f8faf6]' : 'bg-white'
                      }`}
                    >
                      <div className="relative h-20 w-16 overflow-hidden rounded-lg bg-[#edf0eb]">
                        <Image
                          src={product.featuredImage.url}
                          alt={product.featuredImage.altText}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <h4 className="text-[12px] font-semibold text-[#27362e]">
                            {product.title}
                          </h4>
                          <span className="text-[11px] text-[#788179]">{product.productType}</span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-[12px]">
                          <span className="text-[#59645b]">
                            Selling:{' '}
                            <strong className="font-semibold text-[#27362e]">
                              {new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: product.priceRange.minVariantPrice.currencyCode
                              }).format(Number(product.priceRange.minVariantPrice.amount))}
                            </strong>
                          </span>
                          <span className="text-[#59645b]">
                            Original:{' '}
                            <strong
                              className={
                                Number(product.priceRange.minCompareAtPrice.amount) >
                                Number(product.priceRange.minVariantPrice.amount)
                                  ? 'font-medium text-[#788179] line-through'
                                  : 'font-medium text-[#27362e]'
                              }
                            >
                              {new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: product.priceRange.minCompareAtPrice.currencyCode
                              }).format(Number(product.priceRange.minCompareAtPrice.amount))}
                            </strong>
                            {Number(product.priceRange.minCompareAtPrice.amount) >
                            Number(product.priceRange.minVariantPrice.amount) ? (
                              <span className="ml-1 font-semibold text-[#a33e30]">
                                {Math.round(
                                  ((Number(product.priceRange.minCompareAtPrice.amount) -
                                    Number(product.priceRange.minVariantPrice.amount)) /
                                    Number(product.priceRange.minCompareAtPrice.amount)) *
                                    100
                                )}
                                % off
                              </span>
                            ) : null}
                          </span>
                          <span className="text-[#59645b]">
                            Total stock:{' '}
                            <strong className="font-semibold text-[#27362e]">{stock} units</strong>
                          </span>
                          <span className="text-[#59645b]">
                            Material:{' '}
                            <strong className="font-medium text-[#27362e]">
                              {product.material}
                            </strong>
                          </span>
                        </div>

                        <div className="mt-3 grid gap-x-6 gap-y-3 lg:grid-cols-2">
                          <div>
                            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#788179]">
                              Colors · stock by color
                            </p>
                            <ul className="flex flex-wrap gap-1.5">
                              {colorTotals.map(({ color, quantity }) => (
                                <li
                                  key={color}
                                  className={`rounded-md px-2.5 py-1.5 text-[11px] ${
                                    quantity > 0
                                      ? 'bg-[#edf3e7] text-[#526c3a]'
                                      : 'bg-[#fbefec] text-[#9a392d]'
                                  }`}
                                >
                                  {color}: {quantity}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#788179]">
                              Sizes · stock by size
                            </p>
                            <ul className="flex flex-wrap gap-1.5">
                              {sizeTotals.map(({ size, quantity }) => (
                                <li
                                  key={size}
                                  className={`rounded-md px-2.5 py-1.5 text-[11px] ${
                                    quantity > 0
                                      ? 'bg-[#edf3e7] text-[#526c3a]'
                                      : 'bg-[#fbefec] text-[#9a392d]'
                                  }`}
                                >
                                  {size}: {quantity}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={saving || uploadingImages}
                        onClick={() => {
                          setSelectedId(product.id);
                          setInventoryDraft(
                            Object.fromEntries(
                              product.variants.map((variant) => [
                                variant.id,
                                variant.inventoryQuantity
                              ])
                            )
                          );
                          setImageDraft(product.images);
                          setInventorySearch('');
                          setInventoryFilter('all');
                          setMessage('');
                          setError('');
                          document
                            .getElementById('edit-product-title')
                            ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }}
                        aria-label={`Edit inventory for ${product.title}`}
                        className={`w-fit rounded-full px-4 py-2.5 text-[12px] font-semibold transition-colors ${
                          isSelected
                            ? 'bg-[#edf3e7] text-[#526c3a]'
                            : 'border border-[#dce3da] text-[#526c3a] hover:border-[#9aad8e] hover:bg-[#f2f5f0]'
                        } disabled:cursor-not-allowed disabled:opacity-50`}
                      >
                        {isSelected ? 'Selected' : 'Manage stock'}
                      </button>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {selectedProduct ? (
        <section
          aria-labelledby="edit-product-title"
          className="border-t border-[#e8ece6] bg-[#f8faf6] px-5 py-6 sm:px-6"
        >
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 id="edit-product-title" className="text-sm font-semibold text-[#17211f]">
                Manage product & inventory
              </h3>
              <p className="mt-1 text-[12px] text-[#788179]">
                {databaseConfigured
                  ? 'Updates are saved to Supabase and reflected across the storefront.'
                  : 'Connect Supabase to save updates and publish them to the storefront.'}
              </p>
            </div>
            <span className="rounded-full bg-[#edf3e7] px-3 py-1.5 text-[11px] font-medium text-[#526c3a]">
              {selectedProduct.title}
            </span>
          </div>

          <section
            aria-label={`${selectedProduct.title} inventory summary`}
            className="mb-6 rounded-xl border border-[#dfe6dc] bg-white p-4 sm:p-5"
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg bg-[#f6f8f4] p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#788179]">
                  Total units
                </p>
                <p className="mt-1.5 text-xl font-semibold tracking-tight text-[#17211f]">
                  {inventorySummary.totalUnits}
                </p>
              </div>
              <div className="rounded-lg bg-[#edf3e7] p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#71845d]">
                  Colors in stock
                </p>
                <p className="mt-1.5 text-xl font-semibold tracking-tight text-[#304a2a]">
                  {colors.filter((color) => (inventorySummary.colorUnits[color] || 0) > 0).length}
                  <span className="ml-1 text-[11px] font-medium text-[#71845d]">
                    / {colors.length}
                  </span>
                </p>
              </div>
              <div className="rounded-lg bg-[#edf3e7] p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#71845d]">
                  Sizes in stock
                </p>
                <p className="mt-1.5 text-xl font-semibold tracking-tight text-[#304a2a]">
                  {sizes.filter((size) => (inventorySummary.sizeUnits[size] || 0) > 0).length}
                  <span className="ml-1 text-[11px] font-medium text-[#71845d]">
                    / {sizes.length}
                  </span>
                </p>
              </div>
              <div className="rounded-lg bg-[#fbefec] p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#a66b62]">
                  Out of stock
                </p>
                <p className="mt-1.5 text-xl font-semibold tracking-tight text-[#9a392d]">
                  {inventorySummary.outOfStockVariants}
                  <span className="ml-1 text-[11px] font-medium text-[#a66b62]">variants</span>
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-5 border-t border-[#edf0eb] pt-4 sm:grid-cols-2">
              <div>
                <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#68736b]">
                  Stock by color
                </h4>
                <ul className="space-y-2">
                  {colors.map((color) => {
                    const availability = inventorySummary.colorSizes[color] || {
                      inStock: 0,
                      total: 0
                    };
                    const stock = inventorySummary.colorUnits[color] || 0;
                    return (
                      <li
                        key={color}
                        className="flex items-center justify-between gap-3 text-[12px]"
                      >
                        <span className="font-medium text-[#334239]">{color}</span>
                        <span className={stock > 0 ? 'text-[#526c3a]' : 'text-[#9a392d]'}>
                          {stock} units · {availability.inStock}/{availability.total} sizes
                          available
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div>
                <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#68736b]">
                  Stock by size
                </h4>
                <ul className="space-y-2">
                  {sizes.map((size) => {
                    const availability = inventorySummary.sizeColors[size] || {
                      inStock: 0,
                      total: 0
                    };
                    const stock = inventorySummary.sizeUnits[size] || 0;
                    return (
                      <li
                        key={size}
                        className="flex items-center justify-between gap-3 text-[12px]"
                      >
                        <span className="font-medium text-[#334239]">{size}</span>
                        <span className={stock > 0 ? 'text-[#526c3a]' : 'text-[#9a392d]'}>
                          {stock} units · {availability.inStock}/{availability.total} colors
                          available
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </section>

          <form
            key={`${selectedProduct.id}-${selectedProduct.title}-${
              selectedProduct.priceRange.minVariantPrice.amount
            }-${selectedProduct.priceRange.minCompareAtPrice.amount}-${selectedProduct.variants
              .map((variant) => variant.inventoryQuantity)
              .join(',')}`}
            onSubmit={saveProduct}
            className="space-y-5"
          >
            <fieldset disabled={saving} className="space-y-5 disabled:opacity-70">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="product-title"
                    className="mb-1.5 block text-[12px] font-medium text-[#59645b]"
                  >
                    Product name
                  </label>
                  <input
                    id="product-title"
                    name="title"
                    defaultValue={selectedProduct.title}
                    required
                    maxLength={160}
                    className="w-full rounded-lg border border-[#dce3da] bg-white px-3 py-2.5 text-[12px] text-[#17211f] outline-none focus:border-[#9aad8e]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="product-price"
                    className="mb-1.5 block text-[12px] font-medium text-[#59645b]"
                  >
                    Selling price (USD)
                  </label>
                  <input
                    id="product-price"
                    name="priceAmount"
                    type="number"
                    min="0.01"
                    max="99999999.99"
                    step="0.01"
                    defaultValue={selectedProduct.priceRange.minVariantPrice.amount}
                    required
                    className="w-full rounded-lg border border-[#dce3da] bg-white px-3 py-2.5 text-[12px] text-[#17211f] outline-none focus:border-[#9aad8e]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="product-compare-price"
                    className="mb-1.5 block text-[12px] font-medium text-[#59645b]"
                  >
                    Original price (USD)
                  </label>
                  <input
                    id="product-compare-price"
                    name="compareAtAmount"
                    type="number"
                    min={selectedProduct.priceRange.minVariantPrice.amount}
                    max="99999999.99"
                    step="0.01"
                    defaultValue={selectedProduct.priceRange.minCompareAtPrice.amount}
                    className="w-full rounded-lg border border-[#dce3da] bg-white px-3 py-2.5 text-[12px] text-[#17211f] outline-none focus:border-[#9aad8e]"
                  />
                  <p className="mt-1 text-[11px] text-[#788179]">
                    Set this above the selling price to show the discount.
                  </p>
                </div>
              </div>
              <div>
                <label
                  htmlFor="product-description"
                  className="mb-1.5 block text-[12px] font-medium text-[#59645b]"
                >
                  Description
                </label>
                <textarea
                  id="product-description"
                  name="description"
                  defaultValue={selectedProduct.description}
                  required
                  maxLength={5000}
                  rows={3}
                  className="w-full resize-y rounded-lg border border-[#dce3da] bg-white px-3 py-2.5 text-[12px] leading-5 text-[#17211f] outline-none focus:border-[#9aad8e]"
                />
              </div>
              <ProductImageManager
                key={selectedProduct.id}
                productId={selectedProduct.id}
                productTitle={selectedProduct.title}
                images={imageDraft}
                onChange={setImageDraft}
                onUploadingChange={setUploadingImages}
                storageConfigured={b2StorageConfigured}
                disabled={!databaseConfigured || saving || uploadingImages}
              />
            </fieldset>

            <section
              aria-labelledby="inventory-title"
              className="overflow-hidden rounded-xl border border-[#dfe6dc] bg-white"
            >
              <div className="border-b border-[#e8ece6] px-4 py-4 sm:px-5">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <h4 id="inventory-title" className="text-[12px] font-semibold text-[#27362e]">
                      Inventory by variant
                    </h4>
                    <p className="mt-1 text-[12px] text-[#788179]">
                      Update the stock count for each color and size.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    <span className="rounded-full bg-[#edf3e7] px-2.5 py-1 text-[#526c3a]">
                      {
                        selectedProduct.variants.filter(
                          (variant) => (inventoryDraft[variant.id] ?? 0) > 5
                        ).length
                      }{' '}
                      in stock
                    </span>
                    <span className="rounded-full bg-[#fbf7e9] px-2.5 py-1 text-[#8a6d27]">
                      {
                        selectedProduct.variants.filter((variant) => {
                          const quantity = inventoryDraft[variant.id] ?? 0;
                          return quantity > 0 && quantity <= 5;
                        }).length
                      }{' '}
                      low
                    </span>
                    <span className="rounded-full bg-[#fbefec] px-2.5 py-1 text-[#9a392d]">
                      {
                        selectedProduct.variants.filter(
                          (variant) => (inventoryDraft[variant.id] ?? 0) === 0
                        ).length
                      }{' '}
                      out
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <label className="min-w-0 flex-1">
                    <span className="sr-only">Search variants</span>
                    <input
                      type="search"
                      value={inventorySearch}
                      onChange={(event) => setInventorySearch(event.target.value)}
                      placeholder="Search color or size"
                      className="w-full rounded-lg border border-[#dce3da] bg-[#fbfcfa] px-3 py-2.5 text-[12px] text-[#17211f] outline-none focus:border-[#9aad8e]"
                    />
                  </label>
                  <label>
                    <span className="sr-only">Filter inventory status</span>
                    <select
                      value={inventoryFilter}
                      onChange={(event) =>
                        setInventoryFilter(event.target.value as 'all' | 'low' | 'out')
                      }
                      className="w-full rounded-lg border border-[#dce3da] bg-[#fbfcfa] px-3 py-2.5 text-[12px] text-[#334239] outline-none focus:border-[#9aad8e] sm:w-auto"
                    >
                      <option value="all">All variants</option>
                      <option value="low">Low stock (1–5)</option>
                      <option value="out">Out of stock</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left">
                  <thead className="bg-[#f6f8f4] text-[11px] font-semibold uppercase tracking-[0.12em] text-[#788179]">
                    <tr>
                      <th className="px-4 py-2.5 font-semibold sm:px-5">Variant</th>
                      <th className="px-3 py-2.5 font-semibold">Status</th>
                      <th className="px-4 py-2.5 text-right font-semibold sm:px-5">Quantity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#edf0eb]">
                    {visibleVariants.map((variant) => {
                      const quantity = inventoryDraft[variant.id] ?? 0;
                      const color = variant.selectedOptions.find(
                        (option) => option.name.toLowerCase() === 'color'
                      )?.value;
                      const size = variant.selectedOptions.find(
                        (option) => option.name.toLowerCase() === 'size'
                      )?.value;
                      const status =
                        quantity === 0 ? 'Out of stock' : quantity <= 5 ? 'Low stock' : 'In stock';
                      return (
                        <tr key={variant.id} className="text-[13px]">
                          <td className="px-4 py-3 sm:px-5">
                            <span className="font-medium text-[#27362e]">
                              {color || variant.title}
                            </span>
                            {size ? (
                              <span className="ml-2 rounded-md bg-[#f2f5f0] px-2 py-1 text-[11px] text-[#68736b]">
                                {size}
                              </span>
                            ) : null}
                          </td>
                          <td className="px-3 py-3">
                            <span
                              className={`inline-flex items-center gap-1.5 ${
                                quantity === 0
                                  ? 'text-[#9a392d]'
                                  : quantity <= 5
                                  ? 'text-[#8a6d27]'
                                  : 'text-[#526c3a]'
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  quantity === 0
                                    ? 'bg-[#c45a4a]'
                                    : quantity <= 5
                                    ? 'bg-[#c6a747]'
                                    : 'bg-[#7ba747]'
                                }`}
                              />
                              {status}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right sm:px-5">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={saving || quantity <= 0}
                                aria-label={`Decrease ${variant.title} stock`}
                                onClick={() =>
                                  setInventoryDraft((current) => ({
                                    ...current,
                                    [variant.id]: Math.max(0, (current[variant.id] ?? 0) - 1)
                                  }))
                                }
                                className="flex h-7 w-7 items-center justify-center rounded-md border border-[#dce3da] text-[#59645b] hover:bg-[#f2f5f0] disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                −
                              </button>
                              <input
                                aria-label={`${variant.title} stock quantity`}
                                type="number"
                                min="0"
                                max="100000"
                                step="1"
                                value={quantity}
                                disabled={saving}
                                onChange={(event) => {
                                  const nextValue = event.target.value;
                                  if (nextValue === '') {
                                    setInventoryDraft((current) => ({
                                      ...current,
                                      [variant.id]: 0
                                    }));
                                    return;
                                  }
                                  setInventoryDraft((current) => ({
                                    ...current,
                                    [variant.id]: Math.min(100000, Math.max(0, Number(nextValue)))
                                  }));
                                }}
                                className="w-[84px] rounded-md border border-[#dce3da] px-2 py-2 text-center text-[13px] font-semibold text-[#17211f] outline-none focus:border-[#9aad8e] disabled:bg-[#f3f5f1]"
                              />
                              <button
                                type="button"
                                disabled={saving || quantity >= 100000}
                                aria-label={`Increase ${variant.title} stock`}
                                onClick={() =>
                                  setInventoryDraft((current) => ({
                                    ...current,
                                    [variant.id]: Math.min(100000, (current[variant.id] ?? 0) + 1)
                                  }))
                                }
                                className="flex h-7 w-7 items-center justify-center rounded-md border border-[#dce3da] text-[#59645b] hover:bg-[#f2f5f0] disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                +
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {visibleVariants.length === 0 ? (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-4 py-8 text-center text-[13px] text-[#788179]"
                        >
                          No variants match this search and stock filter.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
              <p className="border-t border-[#edf0eb] px-4 py-3 text-[11px] leading-5 text-[#788179] sm:px-5">
                Stock status updates as you edit. Changes are not saved until you select Save
                product below.
              </p>
            </section>
            {error ? (
              <p
                role="alert"
                className="rounded-lg bg-[#fbefec] px-3 py-2 text-[13px] text-[#9a392d]"
              >
                {error}
              </p>
            ) : null}
            {message ? (
              <p
                role="status"
                className="rounded-lg bg-[#edf3e7] px-3 py-2 text-[13px] text-[#526c3a]"
              >
                {message}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={
                !databaseConfigured ||
                saving ||
                uploadingImages ||
                imageDraft.length === 0
              }
              className="rounded-full bg-[#172c27] px-5 py-3 text-[13px] font-semibold text-white transition-colors hover:bg-[#27483d] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {saving ? 'Saving…' : 'Save product'}
            </button>
          </form>
        </section>
      ) : null}
    </div>
  );
}
