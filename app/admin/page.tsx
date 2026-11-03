import { requireAdmin } from 'lib/admin-auth';
import { isCatalogDatabaseConfigured } from 'lib/catalog-storage';
import { getOrderStats, isOrdersDatabaseConfigured } from 'lib/orders-storage';
import { getAllCollections, getProducts } from 'lib/store';
import Link from 'next/link';

export const metadata = {
  title: 'Admin dashboard',
  description: 'Edit products and inventory for the storefront.'
};

const navigation = [
  { label: 'Overview', href: '#overview', active: true },
  { label: 'Products', href: '/admin/products', active: false },
  { label: 'Orders', href: '/admin/orders', active: false },
  { label: 'Coupons & shipping', href: '/admin/coupons', active: false },
  { label: 'Inventory & content', href: '/admin/inventory', active: false },
  { label: 'Collections', href: '/admin/inventory#collections', active: false },
  { label: 'Homepage', href: '/admin/inventory#homepage-content', active: false },
  { label: 'Invoice settings', href: '/admin/invoice-settings', active: false }
];

export default async function AdminPage() {
  await requireAdmin();

  const [products, collections, orderStats] = await Promise.all([
    getProducts(),
    getAllCollections(),
    getOrderStats()
  ]);
  const databaseConfigured = isCatalogDatabaseConfigured();
  const variants = products.flatMap((product) => product.variants);
  const totalUnits = variants.reduce((total, variant) => total + variant.inventoryQuantity, 0);
  const lowStockVariants = variants.filter(
    (variant) => variant.inventoryQuantity > 0 && variant.inventoryQuantity <= 5
  ).length;
  const outOfStockVariants = variants.filter((variant) => variant.inventoryQuantity === 0).length;

  return (
    <main className="mx-auto min-h-screen max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#607b4a]">
            Store management
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-[#17211f] sm:text-4xl">
            Admin dashboard
          </h1>
          <p className="mt-2 text-[13px] text-[#68736b]">A quick overview of your storefront.</p>
        </div>
        <Link
          href="/admin/inventory"
          className="inline-flex w-fit items-center rounded-full bg-[#172c27] px-4 py-2.5 text-[11px] font-semibold text-white transition-colors hover:bg-[#27483d]"
        >
          Open store editor →
        </Link>
      </div>

      {!databaseConfigured ? (
        <div
          role="status"
          className="mb-8 flex items-start gap-3 rounded-xl border border-[#e4d7aa] bg-[#fbf7e9] px-4 py-3.5 text-[12px] leading-5 text-[#6c5b2c]"
        >
          <span aria-hidden="true" className="mt-0.5 text-base">ⓘ</span>
          <p>
            <span className="font-semibold">Store edits are not persistent yet.</span> Add
            SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to the server environment and apply the
            documented migrations to save product and homepage changes.
          </p>
        </div>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[210px_minmax(0,1fr)]">
        <aside className="h-fit rounded-2xl border border-[#e1e7de] bg-[#fbfcfa] p-3 lg:sticky lg:top-24">
          <p className="px-3 pb-3 pt-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8a928b]">
            Workspace
          </p>
          <nav aria-label="Admin navigation">
            <ul className="flex gap-2 overflow-x-auto lg:flex-col">
              {navigation.map((item) => (
                <li key={item.href} className="shrink-0">
                  <Link
                    href={item.href}
                    aria-current={item.active ? 'page' : undefined}
                    className={
                      item.active
                        ? 'block rounded-xl bg-[#edf3e7] px-3 py-2.5 text-[12px] font-semibold text-[#304a2a]'
                        : 'block rounded-xl px-3 py-2.5 text-[12px] font-medium text-[#68736b] transition-colors hover:bg-[#f2f5f0] hover:text-[#17211f]'
                    }
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-5 hidden rounded-xl bg-[#f2f5f0] p-3 lg:block">
            <p className="text-[10px] font-semibold text-[#334239]">Store status</p>
            <p className="mt-2 flex items-center gap-2 text-[10px] text-[#68736b]">
              <span
                className={`h-2 w-2 rounded-full ${databaseConfigured ? 'bg-[#7ba747]' : 'bg-[#c6a747]'}`}
              />
              {databaseConfigured ? 'Supabase connected' : 'Preview mode'}
            </p>
          </div>
        </aside>

        <div className="min-w-0 space-y-8">
          <section id="overview" aria-labelledby="overview-title">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <h2 id="overview-title" className="text-lg font-semibold tracking-tight text-[#17211f]">
                  Store overview
                </h2>
                <p className="mt-1 text-[11px] text-[#8a928b]">
                  {databaseConfigured ? 'Catalog and inventory overview' : 'Sample catalog preview'}
                </p>
              </div>
              <span className="rounded-full bg-[#f0f2ed] px-3 py-1.5 text-[9px] font-medium uppercase tracking-[0.12em] text-[#788179]">
                {databaseConfigured ? 'Supabase' : 'Preview'}
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <article className="rounded-2xl border border-[#e1e7de] bg-[#fbfcfa] p-5">
                <p className="text-[11px] text-[#788179]">Catalog products</p>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[#17211f]">
                  {products.length}
                </p>
                <p className="mt-2 text-[10px] text-[#8a928b]">
                  {databaseConfigured ? 'Store catalog' : 'Local sample catalog'}
                </p>
              </article>
              <article className="rounded-2xl border border-[#e1e7de] bg-[#fbfcfa] p-5">
                <p className="text-[11px] text-[#788179]">Collections</p>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[#17211f]">
                  {collections.length}
                </p>
                <p className="mt-2 text-[10px] text-[#8a928b]">Available on the storefront</p>
              </article>
              <Link
                href="/admin/products"
                className="group rounded-2xl border border-[#dce8c7] bg-[#f5f8ef] p-5 transition-all hover:-translate-y-0.5 hover:border-[#b7cb97] hover:shadow-[0_10px_25px_rgba(23,44,39,0.07)] motion-reduce:transform-none motion-reduce:transition-none"
              >
                <p className="text-[11px] text-[#788179]">Product management</p>
                <p className="mt-3 text-lg font-semibold tracking-[-0.03em] text-[#17211f]">
                  Edit products
                </p>
                <p className="mt-2 text-[10px] font-medium text-[#526c3a]">
                  Price · images · stock <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
                </p>
              </Link>
              <article className="rounded-2xl border border-[#e1e7de] bg-[#fbfcfa] p-5">
                <p className="text-[11px] text-[#788179]">Units in stock</p>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[#17211f]">
                  {totalUnits.toLocaleString()}
                </p>
                <p className="mt-2 text-[10px] text-[#8a928b]">Across all product variants</p>
              </article>
              <Link
                href="/admin/orders"
                className="group rounded-2xl border border-[#dce8c7] bg-[#f5f8ef] p-5 transition-all hover:-translate-y-0.5 hover:border-[#b7cb97] hover:shadow-[0_10px_25px_rgba(23,44,39,0.07)] motion-reduce:transform-none motion-reduce:transition-none"
              >
                <p className="text-[11px] text-[#788179]">Orders</p>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[#17211f]">
                  {orderStats.totalOrders}
                </p>
                <p className="mt-2 text-[10px] font-medium text-[#526c3a]">
                  {orderStats.paidOrders} paid · ₹{Number(orderStats.totalRevenue).toLocaleString('en-IN', { minimumFractionDigits: 2 })} revenue{' '}
                  <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
                </p>
              </Link>
            </div>
          </section>

          <section
            id="products"
            aria-labelledby="stock-alerts-title"
            className="rounded-2xl border border-[#e1e7de] bg-[#fbfcfa] p-5 sm:p-6"
          >
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="stock-alerts-title" className="text-sm font-semibold text-[#17211f]">
                  Inventory health
                </h2>
                <p className="mt-1 text-[11px] text-[#788179]">
                  Variants with five or fewer units, or currently out of stock.
                </p>
              </div>
              <Link
                href="/admin/products"
                className="text-[11px] font-semibold text-[#526c3a] hover:text-[#304a2a]"
              >
                Edit products →
              </Link>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-[#e1e7de] bg-white p-4">
                <p className="text-[11px] text-[#788179]">Low-stock variants</p>
                <p className="mt-2 text-2xl font-semibold text-[#17211f]">{lowStockVariants}</p>
              </div>
              <div className="rounded-xl border border-[#e1e7de] bg-white p-4">
                <p className="text-[11px] text-[#788179]">Out-of-stock variants</p>
                <p className="mt-2 text-2xl font-semibold text-[#17211f]">
                  {outOfStockVariants}
                </p>
              </div>
            </div>
          </section>

          {isOrdersDatabaseConfigured() && (
            <section
              aria-labelledby="orders-section-title"
              className="flex flex-col justify-between gap-4 rounded-2xl border border-[#dce8c7] bg-[#f5f8ef] p-5 sm:flex-row sm:items-center sm:p-6"
            >
              <div>
                <h2 id="orders-section-title" className="text-sm font-semibold text-[#17211f]">
                  Recent orders
                </h2>
                <p className="mt-1 text-[11px] text-[#68736b]">
                  View customer orders and payment status.
                </p>
                <div className="mt-2 flex gap-2">
                  <span className="rounded-full border border-[#e1e7de] px-2.5 py-0.5 text-[10px] text-[#68736b]">
                    {orderStats.totalOrders} total
                  </span>
                  <span className="rounded-full border border-[#e1e7de] px-2.5 py-0.5 text-[10px] text-[#68736b]">
                    {orderStats.paidOrders} paid
                  </span>
                  <span className="rounded-full border border-[#e1e7de] px-2.5 py-0.5 text-[10px] text-[#68736b]">
                    ₹{Number(orderStats.totalRevenue).toLocaleString('en-IN', { minimumFractionDigits: 2 })} revenue
                  </span>
                </div>
              </div>
              <Link
                href="/admin/orders"
                className="inline-flex w-fit shrink-0 items-center rounded-full bg-[#172c27] px-5 py-2.5 text-[11px] font-semibold text-white transition-colors hover:bg-[#27483d]"
              >
                View orders →
              </Link>
            </section>
          )}

          <section
            className="flex flex-col justify-between gap-4 rounded-2xl border border-[#dce8c7] bg-[#f5f8ef] p-5 sm:flex-row sm:items-center sm:p-6"
          >
            <div>
              <h2 id="products-editor-title" className="text-sm font-semibold text-[#17211f]">
                Product catalog
              </h2>
              <p className="mt-1 text-[11px] text-[#68736b]">
                Edit product names, prices, images, and per-variant stock.
              </p>
              <div className="mt-2 flex gap-2">
                <span className="rounded-full border border-[#e1e7de] px-2.5 py-0.5 text-[10px] text-[#68736b]">
                  {products.length} products
                </span>
                <span className="rounded-full border border-[#e1e7de] px-2.5 py-0.5 text-[10px] text-[#68736b]">
                  {products.filter((p) => !p.availableForSale).length} out of stock
                </span>
              </div>
            </div>
            <Link
              href="/admin/products"
              className="inline-flex w-fit shrink-0 items-center rounded-full bg-[#172c27] px-5 py-2.5 text-[11px] font-semibold text-white transition-colors hover:bg-[#27483d]"
            >
              Manage products →
            </Link>
          </section>

          <section
            aria-labelledby="homepage-editor-title"
            className="flex flex-col justify-between gap-4 rounded-2xl border border-[#dce8c7] bg-[#f5f8ef] p-5 sm:flex-row sm:items-center sm:p-6"
          >
            <div>
              <h2 id="homepage-editor-title" className="text-sm font-semibold text-[#17211f]">
                Homepage offers & banner
              </h2>
              <p className="mt-1 text-[11px] text-[#68736b]">
                Edit the three animated offer cards and scrolling banner.
              </p>
            </div>
            <Link
              href="/admin/inventory#homepage-content"
              className="inline-flex w-fit shrink-0 items-center rounded-full bg-[#172c27] px-5 py-2.5 text-[11px] font-semibold text-white transition-colors hover:bg-[#27483d]"
            >
              Edit homepage content →
            </Link>
          </section>

          <section
            aria-labelledby="collections-editor-title"
            className="flex flex-col justify-between gap-4 rounded-2xl border border-[#dce8c7] bg-[#f5f8ef] p-5 sm:flex-row sm:items-center sm:p-6"
          >
            <div>
              <h2 id="collections-editor-title" className="text-sm font-semibold text-[#17211f]">
                Category management
              </h2>
              <p className="mt-1 text-[11px] text-[#68736b]">
                Add, edit, hide, or delete storefront categories.
              </p>
              <div className="mt-2 flex gap-2">
                <span className="rounded-full border border-[#e1e7de] px-2.5 py-0.5 text-[10px] text-[#68736b]">
                  {collections.filter((c) => !c.hidden).length} visible
                </span>
                <span className="rounded-full border border-[#e1e7de] px-2.5 py-0.5 text-[10px] text-[#68736b]">
                  {collections.filter((c) => c.hidden).length} hidden
                </span>
              </div>
            </div>
            <Link
              href="/admin/inventory#collections"
              className="inline-flex w-fit shrink-0 items-center rounded-full bg-[#172c27] px-5 py-2.5 text-[11px] font-semibold text-white transition-colors hover:bg-[#27483d]"
            >
              Manage categories →
            </Link>
          </section>
        </div>
      </div>
    </main>
  );
}
