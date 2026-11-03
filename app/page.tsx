import { AddToCart } from 'components/cart/add-to-cart';
import CategorySlider from 'components/category-slider';
import Footer from 'components/layout/footer';
import Price from 'components/price';
import ProductSlider from 'components/product-slider';
import { Gallery } from 'components/product/gallery';
import { VariantSelector } from 'components/product/variant-selector';
import { getHomepageContent } from 'lib/catalog-storage';
import { getCollectionProducts, getCollections, getProducts } from 'lib/store';
import type { Product } from 'lib/types';
import Image from 'next/image';
import Link from 'next/link';

export const metadata = {
  description: 'Thoughtful everyday goods, made to be used and loved.',
  openGraph: {
    type: 'website'
  }
};

// Cache this page for 1 hour; background revalidation keeps it fresh
export const revalidate = 3600;

/* ── Trust badges ──────────────────────────────── */
const TRUST_BADGES = [
  { icon: '🚚', label: 'Free shipping', sub: 'Orders over $100' },
  { icon: '↩', label: 'Easy returns', sub: '30-day policy' },
  { icon: '🔒', label: 'Secure checkout', sub: 'SSL encrypted' },
  { icon: '✦', label: 'Sustainably made', sub: 'Better materials' }
];

function TrustBar() {
  return (
    <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:grid-cols-4 sm:gap-4">
      {TRUST_BADGES.map((b) => (
        <div
          key={b.label}
          className="glass-card flex items-center gap-3 rounded-xl px-4 py-3 shadow-sm"
        >
          <span className="text-xl" aria-hidden="true">
            {b.icon}
          </span>
          <div>
            <p className="text-[11px] font-semibold text-[#17211f]">{b.label}</p>
            <p className="text-[10px] text-[#68736b]">{b.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Section heading ──────────────────────────────── */
function SectionHeading({
  eyebrow,
  title,
  href,
  linkLabel = 'View all'
}: {
  eyebrow: string;
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-6 flex items-end justify-between">
      <div>
        <span className="accent-pill">
          <span className="h-1.5 w-1.5 rounded-full bg-[#6aa830]" />
          {eyebrow}
        </span>
        <h2 className="mt-3 text-[26px] font-bold leading-tight tracking-[-0.055em] text-[#17211f] sm:text-[32px]">
          {title}
        </h2>
        <span className="section-accent-line" aria-hidden="true" />
      </div>
      {href && (
        <Link
          href={href}
          className="group mb-1 flex items-center gap-1.5 rounded-full border border-[#d9e4d0] bg-white/70 px-4 py-2 text-[11px] font-semibold text-[#4a5a4d] shadow-sm transition-all duration-200 hover:border-[#c6f36b] hover:bg-[#c6f36b] hover:text-[#17211f]"
        >
          {linkLabel}
          <span
            aria-hidden="true"
            className="transition-transform duration-200 group-hover:translate-x-0.5"
          >
            →
          </span>
        </Link>
      )}
    </div>
  );
}

function CategoryRail({
  categories
}: {
  categories: { title: string; path: string; image: string }[];
}) {
  return (
    <section className="pt-12 sm:pt-16 animate-section-in" aria-labelledby="categories-heading">
      <SectionHeading
        eyebrow="Find your next favorite"
        title="Shop by category"
        href="/search"
        linkLabel="View all"
      />
      <CategorySlider categories={categories} />
    </section>
  );
}

function ProductRail({
  title,
  eyebrow,
  products,
  href
}: {
  title: string;
  eyebrow: string;
  products: Product[];
  href: string;
}) {
  if (!products.length) return null;

  return (
    <section className="pt-14 sm:pt-18 animate-section-in" aria-label={title}>
      <SectionHeading eyebrow={eyebrow} title={title} href={href} linkLabel="Shop all" />
      <ProductSlider products={products} title={title} />
    </section>
  );
}

function FeaturedProduct({ product }: { product: Product }) {
  return (
    <section className="pt-14 sm:pt-18 animate-section-in" aria-labelledby="featured-product-title">
      <SectionHeading
        eyebrow="Choose your fit"
        title="Shop this week's pick"
      />
      <div className="grid overflow-hidden rounded-3xl border border-[#d8e8cc] bg-gradient-to-br from-[#fbfcfa] to-[#f2f7eb] shadow-[0_24px_60px_rgba(23,44,39,0.10)] md:grid-cols-2">
        <div className="relative min-w-0 bg-gradient-to-br from-[#dce8d4] to-[#c8d9bc] p-3 sm:p-5">
          <Gallery
            images={product.images.map((image) => ({
              src: image.url,
              altText: image.altText
            }))}
          />
          <span className="badge-pop pointer-events-none absolute left-6 top-6 z-10 rounded-full bg-[#fbfcfa]/90 px-3.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-[#334239] shadow-sm backdrop-blur sm:left-8 sm:top-8">
            ✦ This week&apos;s pick
          </span>
        </div>
        <div className="p-6 sm:p-9 lg:p-12">
          <p className="accent-pill inline-flex">Considered everyday goods</p>
          <div className="mt-4 flex items-start justify-between gap-4">
            <h3 className="text-[28px] font-bold leading-tight tracking-[-0.055em] text-[#17211f] sm:text-[36px]">
              {product.title}
            </h3>
            <Price
              className="flex shrink-0 flex-col items-end gap-1 pt-1 text-[14px]"
              amount={product.priceRange.minVariantPrice.amount}
              compareAtAmount={product.priceRange.minCompareAtPrice.amount}
              currencyCode={product.priceRange.minVariantPrice.currencyCode}
            />
          </div>
          <p className="mt-3 max-w-[440px] text-[13px] leading-6 text-[#68736b]">
            {product.description}
          </p>

          <div className="mt-7">
            <VariantSelector options={product.options} variants={product.variants} />
          </div>

          <div className="mt-5 max-w-[430px]">
            <AddToCart variants={product.variants} availableForSale={product.availableForSale} />
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-center text-[10px] text-[#8d8981]">
            <span aria-hidden="true">🚚</span>
            Complimentary shipping on orders over $100
          </p>
          <Link
            href={product.handle}
            className="mt-5 inline-flex items-center gap-2 text-[11px] font-semibold text-[#4a6e2a] underline decoration-[#c6f36b] decoration-2 underline-offset-4 hover:text-[#17211f]"
          >
            View full product details
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default async function HomePage() {
  // ── All data fetched in a single parallel Promise.all ──────────────────
  // Previously: getHomepageContent + collections.map ran sequentially after
  // the first Promise.all completed, adding two extra waterfall round-trips.
  const collections = await getCollections();
  const [
    products,
    bestSellers,
    trending,
    homepageContent,
    categoryProducts
  ] = await Promise.all([
    getProducts({}),
    getCollectionProducts({ collection: 'featured' }),
    getCollectionProducts({ collection: 'new-arrivals' }),
    getHomepageContent(),
    Promise.all(
      collections.map(async (collection) => ({
        collection,
        // getCatalogProducts is React.cache()-memoised so the parallel calls
        // share one underlying fetch, no N+1 penalty.
        product: (await getCollectionProducts({ collection: collection.handle }))[0]
      }))
    )
  ]);

  const pickOfTheWeek = products.find((product) => product.id === 'field-jacket');
  const topOfTheWeek = products.slice(0, 4);
  const [firstOffer, discountOffer, thirdOffer] = homepageContent.cards;
  const banner = homepageContent.banner;
  const categories = categoryProducts.flatMap(({ collection, product }) =>
    product
      ? [{ title: collection.title, path: collection.path, image: product.featuredImage.url }]
      : []
  );

  return (
    <>
      <div className="mx-auto max-w-[1440px] px-3 pb-20 pt-3 sm:px-5 lg:px-8 lg:pt-6">

        {/* ── Announcement Bar ── */}
        {pickOfTheWeek ? (
          <Link
            href={pickOfTheWeek.handle}
            className="announcement-bar mb-4 flex min-h-10 items-center justify-center gap-2.5 rounded-full px-5 py-2.5 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-white transition-opacity hover:opacity-90 sm:mb-5 sm:text-[11px]"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#c6f36b]" />
            <span className="text-white/70">This week&apos;s pick —</span>
            <span className="text-[#c6f36b]">{pickOfTheWeek.title}</span>
            <span className="rounded-full bg-[#c6f36b]/20 px-2 py-0.5 text-[#c6f36b]" aria-hidden="true">↗</span>
          </Link>
        ) : null}

        {/* ── Hero ── */}
        <section className="relative isolate grid min-h-[480px] overflow-hidden rounded-2xl bg-[#172c27] md:grid-cols-[0.9fr_1.1fr] lg:min-h-[580px]">
          {/* Ambient orbs */}
          <div
            aria-hidden="true"
            className="hero-orb left-[-10%] top-[-20%] h-72 w-72 bg-[#c6f36b]/20"
          />
          <div
            aria-hidden="true"
            className="hero-orb bottom-[-15%] left-[25%] h-56 w-56 bg-[#3a6b55]/50"
          />

          {/* Left — Text */}
          <div className="relative z-10 flex flex-col items-start justify-center px-7 py-12 sm:px-12 lg:px-[11%]">
            <p className="animate-fade-up animate-fade-up-1 mb-5 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#c6f36b]">
              <span className="pulse-dot relative h-1.5 w-1.5 rounded-full bg-[#c6f36b]" />
              New season / 2026
            </p>
            <h1 className="animate-fade-up animate-fade-up-2 max-w-[500px] text-[44px] font-extrabold leading-[0.95] tracking-[-0.065em] text-white sm:text-[58px] lg:text-[72px]">
              Made for your kind of{' '}
              <span className="gradient-text-hero">everyday.</span>
            </h1>
            <p className="animate-fade-up animate-fade-up-3 mt-6 max-w-[340px] text-[13px] leading-[1.7] text-white/60">
              Thoughtful essentials with a little more life in them. Find your new forever-favorites.
            </p>
            <Link
              href="/search"
              className="btn-shimmer animate-fade-up animate-fade-up-4 mt-8 inline-flex items-center gap-3 rounded-full px-7 py-4 text-[12px] font-bold text-[#17211f] shadow-[0_4px_20px_rgba(198,243,107,0.35)]"
            >
              Shop the collection
              <span
                aria-hidden="true"
                className="flex h-6 w-6 items-center justify-center rounded-full bg-[#172c27]/20 text-[14px]"
              >
                ↗
              </span>
            </Link>

            {/* Social proof */}
            <div className="animate-fade-up animate-fade-up-4 mt-8 flex items-center gap-3 text-[10px] font-medium text-white/55">
              <span className="flex -space-x-2">
                <span className="h-7 w-7 rounded-full border-2 border-[#172c27] bg-[#d9a286]" />
                <span className="h-7 w-7 rounded-full border-2 border-[#172c27] bg-[#c8d4bf]" />
                <span className="h-7 w-7 rounded-full border-2 border-[#172c27] bg-[#e4d8c9]" />
              </span>
              <span>
                <span className="text-[#c6f36b]">4.9 ★</span>
                {' '}from 2,400+ happy customers
              </span>
            </div>
          </div>

          {/* Right — Image */}
          <div className="absolute inset-0 -z-0 md:relative md:min-h-full">
            <Image
              src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1200&q=75"
              alt="A LEATHER MART 313-inspired look styled for a day out"
              fill
              priority
              fetchPriority="high"
              sizes="(min-width: 768px) 55vw, 100vw"
              className="object-cover object-[58%_center] opacity-50 md:opacity-100"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#172c27] via-[#172c27]/80 to-transparent md:from-[#172c27]/30 md:via-transparent md:to-transparent" />
          </div>
        </section>

        {/* ── Trust Bar ── */}
        <TrustBar />

        {/* ── Promo Banner ── */}
        <section
          aria-label="Great deals and offers"
          className="relative mt-5 overflow-hidden rounded-2xl border border-[#dce8c7] bg-gradient-to-br from-[#fbfcf7] via-[#f2f7e9] to-[#e4efcf] px-3 py-3 shadow-[0_12px_40px_rgba(23,44,39,0.09)] sm:mt-7 sm:rounded-[24px] sm:px-5 sm:py-5"
          style={{
            backgroundImage: `linear-gradient(135deg, rgba(251,252,247,.76), rgba(228,239,207,.70)), url("${banner.imageUrl.replace(
              /[()\"]/g,
              encodeURIComponent
            )}")`
          }}
        >
          <div className="absolute -right-10 -top-16 h-40 w-40 rounded-full bg-[#c6f36b]/25 blur-2xl" />
          <div className="relative flex items-center gap-3 rounded-xl border border-white/80 bg-white/65 px-3 py-3 shadow-sm backdrop-blur-sm sm:gap-5 sm:rounded-2xl sm:px-5 sm:py-4">
            <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#c6f36b] text-xl text-[#172c27] shadow-sm sm:flex">
              ✳
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <div className="promo-marquee-track flex w-max items-center">
                {[0, 1].map((copy) => (
                  <div
                    key={copy}
                    aria-hidden={copy === 1}
                    className="flex shrink-0 items-center gap-4 pr-4 sm:gap-7 sm:pr-7"
                  >
                    <span className="text-[17px] font-black uppercase tracking-[-0.05em] sm:text-[24px]">
                      {banner.badgeTop}
                    </span>
                    <span className="text-lg text-[#78954c] sm:text-2xl" aria-hidden="true">
                      ✳
                    </span>
                    <span className="text-[17px] font-black uppercase tracking-[-0.05em] sm:text-[24px]">
                      {banner.badgeBottom}
                    </span>
                    <span className="text-lg text-[#78954c] sm:text-2xl" aria-hidden="true">
                      ✳
                    </span>
                    <span className="text-[10px] font-medium text-[#59645b] sm:text-[13px]">
                      {banner.description}
                    </span>
                    <span className="text-lg text-[#78954c] sm:text-2xl" aria-hidden="true">
                      ✳
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <Link
              href={banner.href}
              className="btn-dark-shimmer inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-[10px] font-bold text-white shadow-sm sm:px-5 sm:py-3 sm:text-[11px]"
            >
              {banner.buttonLabel} <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </section>

        {/* ── Categories ── */}
        <CategoryRail categories={categories} />

        {/* ── Offer Cards ── */}
        {pickOfTheWeek ? (
          <section
            className="mx-auto grid max-w-[1120px] grid-cols-1 gap-5 pt-12 sm:grid-cols-2 sm:pt-16 lg:grid-cols-3 animate-section-in"
            aria-label="Featured offers"
          >
            {/* Card 1 – dark photo card */}
            <Link
              href={firstOffer.href}
              className="card-shine group relative mx-auto flex aspect-[4/5] w-full max-w-[370px] flex-col justify-between overflow-hidden rounded-3xl bg-[#172c27] p-5 text-white shadow-[0_24px_60px_rgba(23,44,39,0.22)] transition-transform duration-300 hover:-translate-y-1 sm:p-6"
            >
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-cover bg-center opacity-70 transition-transform duration-700 group-hover:scale-105"
                style={{
                  backgroundImage: `url("${firstOffer.imageUrl.replace(
                    /[()\"]/g,
                    encodeURIComponent
                  )}")`
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-[#172c27]/30 via-transparent to-[#172c27]/95" />
              <div className="promo-float badge-pop absolute right-5 top-5 flex h-[74px] w-[74px] rotate-6 flex-col items-center justify-center rounded-full bg-[#c6f36b] text-center text-[#17211f] shadow-xl sm:right-6 sm:top-6">
                <span className="text-[8px] font-bold uppercase tracking-[0.12em]">
                  {firstOffer.badgeTop}
                </span>
                <span className="text-[12px] font-black uppercase">{firstOffer.badgeBottom}</span>
              </div>
              <div className="relative z-10 mt-auto">
                <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.22em] text-[#c6f36b]">
                  {firstOffer.eyebrow}
                </p>
                <h2 className="text-[30px] font-extrabold leading-[0.95] tracking-[-0.06em] sm:text-[33px]">
                  {firstOffer.headline}
                </h2>
                <p className="mt-3 text-[11px] leading-5 text-white/75">{firstOffer.description}</p>
                <span className="mt-5 inline-flex items-center gap-3 rounded-full bg-white px-5 py-3 text-[10px] font-bold text-[#17211f] transition-colors group-hover:bg-[#c6f36b]">
                  {firstOffer.buttonLabel} <span aria-hidden="true">↗</span>
                </span>
              </div>
            </Link>

            {/* Card 2 – discount card */}
            <Link
              href={discountOffer.href}
              className="card-shine group relative mx-auto flex aspect-[4/5] w-full max-w-[370px] flex-col overflow-hidden rounded-3xl bg-[#e9ded2] p-5 text-[#17211f] shadow-[0_24px_60px_rgba(83,57,38,0.18)] transition-transform duration-300 hover:-translate-y-1 sm:p-6"
            >
              <div
                role="img"
                aria-label="Promotional offer"
                className="absolute inset-0 bg-cover bg-center opacity-25 transition-transform duration-700 group-hover:scale-105"
                style={{
                  backgroundImage: `url("${discountOffer.imageUrl.replace(
                    /[()\"]/g,
                    encodeURIComponent
                  )}")`
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-[#e9ded2]/80 via-[#e9ded2]/65 to-[#e9ded2]/95" />
              <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-[#d2a77c]/25 blur-2xl" />
              <div className="relative z-10 flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#6e6255]">
                  {discountOffer.eyebrow}
                </span>
                <span className="rounded-full border border-[#17211f]/15 bg-white/60 px-3 py-1 text-[8px] font-bold uppercase tracking-[0.1em]">
                  {discountOffer.badgeTop}
                </span>
              </div>
              <div className="relative mt-5 flex min-h-0 flex-1 items-center justify-center">
                <span className="promo-float badge-pop absolute right-[3%] top-[25%] z-10 flex h-[88px] w-[88px] flex-col items-center justify-center rounded-full bg-[#c6f36b] text-center text-[#17211f] shadow-2xl sm:h-[96px] sm:w-[96px]">
                  <span className="text-[24px] font-black leading-none">
                    {discountOffer.discountPercent}%
                  </span>
                  <span className="mt-0.5 text-[7px] font-bold uppercase tracking-[0.14em]">Off</span>
                </span>
              </div>
              <div className="relative z-10 mt-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#75634f]">
                  {discountOffer.badgeBottom}
                </p>
                <h2 className="mt-1 text-[28px] font-black uppercase leading-[0.95] tracking-[-0.06em] sm:text-[32px]">
                  {discountOffer.headline}
                </h2>
                <p className="mt-2 text-[11px] font-medium text-[#594b3e]">
                  {discountOffer.description}
                </p>
                <span className="btn-dark-shimmer mt-4 inline-flex items-center gap-4 rounded-full px-5 py-3 text-[10px] font-bold text-white">
                  {discountOffer.buttonLabel} <span aria-hidden="true">↗</span>
                </span>
              </div>
            </Link>

            {/* Card 3 – nature/lifestyle card */}
            <Link
              href={thirdOffer.href}
              className="card-shine group relative mx-auto flex aspect-[4/5] w-full max-w-[370px] flex-col justify-between overflow-hidden rounded-3xl bg-[#dce5d8] p-5 text-[#17211f] shadow-[0_24px_60px_rgba(45,66,49,0.18)] transition-transform duration-300 hover:-translate-y-1 sm:p-6"
            >
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{
                  backgroundImage: `url("${thirdOffer.imageUrl.replace(
                    /[()\"]/g,
                    encodeURIComponent
                  )}")`
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-[#172c27]/10 via-transparent to-[#172c27]/92" />
              <div className="promo-float badge-pop absolute right-5 top-5 flex h-[74px] w-[74px] flex-col items-center justify-center rounded-full border border-white/70 bg-[#fbfcfa]/90 text-center text-[#17211f] shadow-xl backdrop-blur-sm sm:right-6 sm:top-6">
                <span className="text-[8px] font-bold uppercase tracking-[0.12em]">
                  {thirdOffer.badgeTop}
                </span>
                <span className="text-[12px] font-black uppercase">{thirdOffer.badgeBottom}</span>
              </div>
              <div className="relative z-10 mt-auto text-white">
                <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.22em] text-[#c6f36b]">
                  {thirdOffer.eyebrow}
                </p>
                <h2 className="text-[30px] font-extrabold leading-[0.95] tracking-[-0.06em] sm:text-[33px]">
                  {thirdOffer.headline}
                </h2>
                <p className="mt-3 text-[11px] leading-5 text-white/80">{thirdOffer.description}</p>
                <span className="btn-shimmer mt-5 inline-flex items-center gap-3 rounded-full px-5 py-3 text-[10px] font-bold text-[#17211f]">
                  {thirdOffer.buttonLabel} <span aria-hidden="true">↗</span>
                </span>
              </div>
            </Link>
          </section>
        ) : null}

        {/* ── Product Rails ── */}
        <ProductRail
          title="Top of the week"
          eyebrow="The weekly edit"
          products={topOfTheWeek}
          href="/search"
        />
        {pickOfTheWeek ? <FeaturedProduct product={pickOfTheWeek} /> : null}
        <ProductRail
          title="Best sellers"
          eyebrow="Everyday favorites"
          products={bestSellers}
          href="/search"
        />
        <ProductRail
          title="Trending now"
          eyebrow="Fresh finds"
          products={trending}
          href="/search/new-arrivals"
        />
      </div>
      <Footer />
    </>
  );
}
