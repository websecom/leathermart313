import ProductForm from 'components/admin/product-form';
import { requireAdmin } from 'lib/admin-auth';
import { isCatalogDatabaseConfigured } from 'lib/catalog-storage';
import { isScwStorageConfigured } from 'lib/scw-storage';
import { getAllCollections, getProducts } from 'lib/store';
import Image from 'next/image';
import Link from 'next/link';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Products',
  description: 'Manage your storefront product catalog.'
};

export default async function ProductsPage({
  searchParams
}: {
  searchParams?: { edit?: string };
}) {
  await requireAdmin();

  const databaseConfigured = isCatalogDatabaseConfigured();
  const b2StorageConfigured = isScwStorageConfigured();

  const [products, collections] = await Promise.all([getProducts(), getAllCollections()]);
  const editingId = searchParams?.edit;
  const editingProduct = editingId ? products.find((p) => p.id === editingId) : null;

  const totalUnits = products.reduce(
    (sum, p) => sum + p.variants.reduce((s, v) => s + v.inventoryQuantity, 0),
    0
  );
  const outOfStock = products.filter((p) => !p.availableForSale).length;

  return (
    <main className="mx-auto min-h-screen max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">

      {/* ── Header ── */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Link
            href="/admin"
            className="mb-4 inline-flex text-[11px] font-medium text-[#627067] transition-colors hover:text-[#172c27]"
          >
            ← Admin dashboard
          </Link>
          <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#607b4a]">
            Product catalog
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-[#17211f] sm:text-4xl">
            Products
          </h1>
          <p className="mt-2 text-[14px] text-[#68736b]">
            Edit product details, pricing, images, and inventory.
          </p>
        </div>
      </div>

      {/* ── Status banners ── */}
      {!databaseConfigured && (
        <div className="mb-6 rounded-xl border border-[#e4d7aa] bg-[#fbf7e9] px-4 py-3.5 text-[13px] leading-6 text-[#6c5b2c]">
          <span className="font-semibold">Preview mode.</span> Add Supabase credentials to save changes persistently.
        </div>
      )}

      {/* ── Stats bar ── */}
      <div className="mb-8 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-[#e1e7de] bg-[#fbfcfa] p-4">
          <p className="text-[11px] text-[#788179]">Total products</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-[#17211f]">{products.length}</p>
        </div>
        <div className="rounded-2xl border border-[#e1e7de] bg-[#fbfcfa] p-4">
          <p className="text-[11px] text-[#788179]">Units in stock</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-[#17211f]">{totalUnits.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-[#fbefec] bg-[#fbefec] p-4">
          <p className="text-[11px] text-[#a66b62]">Out of stock</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-[#9a392d]">{outOfStock}</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[340px_minmax(0,1fr)]">

        {/* ── Left: product list ── */}
        <aside>
          <div className="sticky top-24 space-y-2">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#68736b]">
              {products.length} products
            </p>
            {products.map((product) => {
              const units = product.variants.reduce((s, v) => s + v.inventoryQuantity, 0);
              const isEditing = product.id === editingId;
              return (
                <Link
                  key={product.id}
                  href={`/admin/products?edit=${product.id}`}
                  scroll={false}
                  className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${
                    isEditing
                      ? 'border-[#172c27] bg-[#172c27] text-white shadow-md'
                      : 'border-[#e1e7de] bg-white hover:border-[#9aad8e] hover:shadow-sm'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="relative h-14 w-14 flex-none overflow-hidden rounded-lg bg-[#edf0eb]">
                    <Image
                      src={product.featuredImage.url}
                      alt={product.featuredImage.altText}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>
                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-[13px] font-semibold ${isEditing ? 'text-white' : 'text-[#17211f]'}`}>
                      {product.title}
                    </p>
                    <p className={`mt-0.5 text-[11px] ${isEditing ? 'text-white/70' : 'text-[#788179]'}`}>
                      ${product.priceRange.minVariantPrice.amount}
                      {' · '}
                      {units > 0 ? (
                        <span className={isEditing ? 'text-[#c6f36b]' : 'text-[#526c3a]'}>{units} units</span>
                      ) : (
                        <span className={isEditing ? 'text-red-300' : 'text-[#a33e30]'}>Out of stock</span>
                      )}
                    </p>
                  </div>
                  <span className={`text-[11px] font-medium ${isEditing ? 'text-white/60' : 'text-[#8a928b]'}`}>
                    Edit →
                  </span>
                </Link>
              );
            })}
          </div>
        </aside>

        {/* ── Right: edit form or placeholder ── */}
        <div>
          {editingProduct ? (
            <ProductForm
              product={editingProduct}
              collections={collections}
              databaseConfigured={databaseConfigured}
              b2StorageConfigured={b2StorageConfigured}
            />
          ) : (
            <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#d0daca] bg-[#f8faf6] p-12 text-center">
              <span className="mb-4 text-5xl" aria-hidden="true">📦</span>
              <h2 className="text-[16px] font-semibold text-[#17211f]">Select a product to edit</h2>
              <p className="mt-2 max-w-xs text-[13px] leading-6 text-[#68736b]">
                Click any product on the left to edit its details, pricing, images, and stock levels.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
