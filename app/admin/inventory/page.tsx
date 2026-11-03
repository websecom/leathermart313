import CollectionManager from 'components/admin/collection-manager';
import HomepagePromoEditor from 'components/admin/homepage-promo-editor';
import ProductEditor from 'components/admin/product-editor';
import SeedEmbeddingsButton from 'components/admin/seed-embeddings-button';
import { requireAdmin } from 'lib/admin-auth';
import {
    getHomepageContent,
    isCatalogDatabaseConfigured
} from 'lib/catalog-storage';
import { isScwStorageConfigured } from 'lib/scw-storage';
import { getAllCollections, getProducts } from 'lib/store';
import { getEmbeddingCount } from 'lib/vector-search';
import Link from 'next/link';

export const runtime = 'nodejs';
export const metadata = {
  title: 'Inventory management',
  description: 'Restricted product and inventory management.'
};

export default async function InventoryPage() {
  await requireAdmin();

  const databaseConfigured = isCatalogDatabaseConfigured();
  const b2StorageConfigured = isScwStorageConfigured();

  const [products, homepageContent, allCollections, embeddingCount] = await Promise.all([
    getProducts(),
    getHomepageContent(),
    getAllCollections(),
    getEmbeddingCount().catch(() => 0)
  ]);
  const collections = allCollections.filter(
    (collection: { handle: string }) => collection.handle !== 'new-arrivals'
  );

  return (
    <main className="mx-auto min-h-screen max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Link
            href="/admin"
            className="mb-4 inline-flex text-[11px] font-medium text-[#627067] transition-colors hover:text-[#172c27]"
          >
            ← Admin dashboard
          </Link>
          <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#607b4a]">
            Restricted workspace
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-[#17211f] sm:text-4xl">
            Inventory management
          </h1>
          <p className="mt-2 text-[15px] text-[#68736b]">
            Review and update stock by product color and size.
          </p>
        </div>
      </div>

      {!databaseConfigured ? (
        <div
          role="status"
          className="mb-6 rounded-xl border border-[#e4d7aa] bg-[#fbf7e9] px-4 py-3.5 text-[14px] leading-6 text-[#6c5b2c]"
        >
          Supabase is not configured. This page is showing sample inventory, and changes cannot be
          saved until database setup is complete.
        </div>
      ) : null}

      <SeedEmbeddingsButton initialCount={embeddingCount} />

      <HomepagePromoEditor
        initialContent={homepageContent}
        databaseConfigured={databaseConfigured}
      />

      <CollectionManager
        initialCollections={allCollections}
        databaseConfigured={databaseConfigured}
      />

      <section
        id="products"
        aria-labelledby="inventory-products-title"
        className="overflow-hidden rounded-2xl border border-[#e1e7de] bg-[#fbfcfa]"
      >
        <div className="flex flex-col justify-between gap-3 border-b border-[#e8ece6] px-5 py-5 sm:flex-row sm:items-center sm:px-6">
          <div>
            <h2 id="inventory-products-title" className="text-base font-semibold text-[#17211f]">
              Products & stock
            </h2>
            <p className="mt-1 text-[13px] text-[#788179]">
              Select a product to manage available quantities for each variant.
            </p>
          </div>
          <span className="w-fit rounded-full border border-[#e1e7de] px-3 py-1.5 text-[12px] text-[#68736b]">
            {products.length} products
          </span>
        </div>
        <ProductEditor
          products={products}
          collections={collections}
          databaseConfigured={databaseConfigured}
          b2StorageConfigured={b2StorageConfigured}
        />
      </section>
    </main>
  );
}
