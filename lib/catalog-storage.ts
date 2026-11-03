import 'server-only';

import type { Collection, Image, Product } from 'lib/types';
import { cache } from 'react';

type ProductOverrideRow = {
  id: unknown;
  title: unknown;
  description: unknown;
  price_amount: unknown;
  compare_at_amount: unknown;
  inventory_quantities: unknown;
  product_images: unknown;
};

type ProductUpdate = {
  id: string;
  title: string;
  description: string;
  priceAmount: string;
  compareAtAmount: string;
  inventoryQuantities: Record<string, number>;
  images: Image[];
  couponCode?: string;
};

export type HomepagePromo = {
  imageUrl: string;
  badgeTop: string;
  badgeBottom: string;
  eyebrow: string;
  headline: string;
  description: string;
  discountPercent: number;
  buttonLabel: string;
  href: string;
};

export type HomepageContent = {
  cards: [HomepagePromo, HomepagePromo, HomepagePromo];
  banner: HomepagePromo;
};

const createDefaultPromo = (values: Partial<HomepagePromo> = {}): HomepagePromo => ({
  imageUrl:
    'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=800&q=70',
  badgeTop: 'Limited',
  badgeBottom: 'edit',
  eyebrow: 'Special prices on selected styles',
  headline: 'Up to 60% off',
  description: 'Lowest ever price',
  discountPercent: 60,
  buttonLabel: 'Shop the deals',
  href: '/search',
  ...values
});

export const DEFAULT_HOMEPAGE_CONTENT: HomepageContent = {
  cards: [
    createDefaultPromo({
      imageUrl:
        'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=70',
      badgeTop: 'Fresh',
      badgeBottom: 'Finds',
      eyebrow: 'The LEATHER MART 313 edit',
      headline: 'Your next favorite is waiting.',
      description: 'Thoughtful everyday pieces, picked just for the season.',
      discountPercent: 0,
      buttonLabel: 'Explore the edit',
      href: '/search'
    }),
    createDefaultPromo(),
    createDefaultPromo({
      imageUrl:
        'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=70',
      badgeTop: 'Easy',
      badgeBottom: 'Layers',
      eyebrow: 'Made for everyday',
      headline: 'Find your new favorites.',
      description: 'Easy layers and versatile essentials for every day.',
      discountPercent: 0,
      buttonLabel: 'Shop clothing',
      href: '/search/clothing'
    })
  ],
  banner: createDefaultPromo({
    imageUrl:
      'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1600&q=85',
    badgeTop: 'Great deals',
    badgeBottom: 'Great offers',
    eyebrow: 'Great deals',
    headline: 'Great offers',
    description: "Find something you'll love",
    discountPercent: 0,
    buttonLabel: 'Shop now',
    href: '/search'
  })
};

type HomepagePromoRow = Record<string, unknown>;

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url && !serviceRoleKey) return null;
  if (!url || !serviceRoleKey) {
    throw new Error(
      'Set both SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to enable catalog storage.'
    );
  }

  return {
    url: url.replace(/\/+$/, ''),
    serviceRoleKey
  };
}

export function isCatalogDatabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

async function supabaseRequest(path: string, init?: RequestInit) {
  const config = getSupabaseConfig();
  if (!config) throw new Error('Catalog database is not configured.');

  const response = await fetch(`${config.url}/rest/v1/${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      'Content-Type': 'application/json',
      ...init?.headers
    }
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Supabase catalog request failed (${response.status}): ${details}`);
  }

  return response;
}

const getOverrideRows = cache(async (): Promise<ProductOverrideRow[]> => {
  const response = await supabaseRequest(
    'store_product_overrides?select=id,title,description,price_amount,compare_at_amount,inventory_quantities,product_images'
  );
  const rows: unknown = await response.json();
  if (!Array.isArray(rows)) throw new Error('Supabase returned an invalid catalog response.');
  return rows.map(validateOverrideRow);
});

function validateOverrideRow(value: unknown): ProductOverrideRow {
  if (!value || typeof value !== 'object') {
    throw new Error('Supabase returned an invalid catalog override.');
  }
  const row = value as Record<string, unknown>;
  if (
    typeof row.id !== 'string' ||
    typeof row.title !== 'string' ||
    typeof row.description !== 'string' ||
    (typeof row.price_amount !== 'string' && typeof row.price_amount !== 'number') ||
    (row.compare_at_amount !== null &&
      typeof row.compare_at_amount !== 'string' &&
      typeof row.compare_at_amount !== 'number') ||
    !row.inventory_quantities ||
    typeof row.inventory_quantities !== 'object' ||
    Array.isArray(row.inventory_quantities) ||
    (row.product_images !== null && !Array.isArray(row.product_images))
  ) {
    throw new Error('Supabase returned a malformed catalog override.');
  }
  return row as ProductOverrideRow;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return entities[character] || character;
  });
}

function applyOverride(product: Product, row: ProductOverrideRow): Product {
  const inventory = row.inventory_quantities as Record<string, unknown>;
  const priceAmount = String(row.price_amount);
  const compareAtAmount = row.compare_at_amount === null ? null : String(row.compare_at_amount);
  const title = String(row.title);
  const description = String(row.description);
  const images =
    row.product_images === null
      ? product.images
      : validateProductImages(row.product_images, product.id, product.images);
  const variants = product.variants.map((variant) => {
    const quantity = inventory[variant.id];
    if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 0) {
      throw new Error(`Supabase inventory data is invalid for variant ${variant.id}.`);
    }
    return {
      ...variant,
      availableForSale: quantity > 0,
      inventoryQuantity: quantity,
      price: { ...variant.price, amount: priceAmount },
      compareAtPrice:
        compareAtAmount && Number(compareAtAmount) > Number(priceAmount)
          ? { ...variant.compareAtPrice, amount: compareAtAmount }
          : { ...variant.price, amount: priceAmount }
    };
  });

  return {
    ...product,
    title,
    description,
    descriptionHtml: `<p>${escapeHtml(description)}</p>`,
    featuredImage: images[0] || { ...product.featuredImage, altText: title },
    images,
    seo: { ...product.seo, title, description },
    priceRange: {
      minVariantPrice: { ...product.priceRange.minVariantPrice, amount: priceAmount },
      maxVariantPrice: { ...product.priceRange.maxVariantPrice, amount: priceAmount },
      minCompareAtPrice:
        compareAtAmount && Number(compareAtAmount) > Number(priceAmount)
          ? { ...product.priceRange.minCompareAtPrice, amount: compareAtAmount }
          : { ...product.priceRange.minVariantPrice, amount: priceAmount },
      maxCompareAtPrice:
        compareAtAmount && Number(compareAtAmount) > Number(priceAmount)
          ? { ...product.priceRange.maxCompareAtPrice, amount: compareAtAmount }
          : { ...product.priceRange.maxVariantPrice, amount: priceAmount }
    },
    variants,
    availableForSale: variants.some((variant) => variant.availableForSale)
  };
}

function validateProductImages(
  value: unknown,
  productId: string,
  fallbackImages: Image[]
): Image[] {
  if (!Array.isArray(value) || value.length > 10) {
    throw new Error(`Supabase image data is invalid for product ${productId}.`);
  }
  return value.map((candidate) => {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
      throw new Error(`Supabase image data is invalid for product ${productId}.`);
    }
    const image = candidate as Record<string, unknown>;
    if (
      typeof image.url !== 'string' ||
      typeof image.altText !== 'string' ||
      typeof image.width !== 'number' ||
      !Number.isInteger(image.width) ||
      image.width < 1 ||
      typeof image.height !== 'number' ||
      !Number.isInteger(image.height) ||
      image.height < 1 ||
      (image.storageKey !== undefined &&
        (typeof image.storageKey !== 'string' ||
          !image.storageKey.startsWith(`products/${productId}/`)))
    ) {
      throw new Error(`Supabase image data is invalid for product ${productId}.`);
    }
    if (!image.storageKey && !fallbackImages.some((fallback) => fallback.url === image.url)) {
      // Allow any external HTTPS URL (Backblaze public URLs, Unsplash, CDN, etc.)
      // Only B2 storageKey images get path-verified above; external URLs are stored as-is.
    }
    return {
      url: image.url,
      altText: image.altText,
      width: image.width,
      height: image.height,
      ...(typeof image.storageKey === 'string' ? { storageKey: image.storageKey } : {})
    };
  });
}

export async function getCatalogProducts(seedProducts: Product[]): Promise<Product[]> {
  if (!getSupabaseConfig()) return seedProducts;

  const overrides = new Map((await getOverrideRows()).map((row) => [String(row.id), row] as const));

  return seedProducts.map((product) => {
    const override = overrides.get(product.id);
    return override ? applyOverride(product, override) : product;
  });
}

export async function getHomepageContent(): Promise<HomepageContent> {
  if (!getSupabaseConfig()) return DEFAULT_HOMEPAGE_CONTENT;

  const response = await supabaseRequest(
    'store_homepage_promo?select=id,image_url,badge_top,badge_bottom,eyebrow,headline,description,discount_percent,button_label,href'
  );
  const rows: unknown = await response.json();
  if (!Array.isArray(rows))
    throw new Error('Supabase returned an invalid homepage content response.');
  const overrides = new Map(
    rows.map((value) => {
      if (!value || typeof value !== 'object') {
        throw new Error('Supabase returned a malformed homepage promo.');
      }
      const row = value as HomepagePromoRow;
      const id = row.id;
      if (
        typeof id !== 'string' ||
        !['offer-card', 'card-1', 'card-2', 'card-3', 'banner'].includes(id) ||
        typeof row.image_url !== 'string' ||
        typeof row.badge_top !== 'string' ||
        typeof row.badge_bottom !== 'string' ||
        typeof row.eyebrow !== 'string' ||
        typeof row.headline !== 'string' ||
        typeof row.description !== 'string' ||
        typeof row.discount_percent !== 'number' ||
        typeof row.button_label !== 'string' ||
        typeof row.href !== 'string'
      ) {
        throw new Error('Supabase returned a malformed homepage promo.');
      }
      return [
        id === 'offer-card' ? 'card-2' : id,
        {
          imageUrl: row.image_url,
          badgeTop: row.badge_top,
          badgeBottom: row.badge_bottom,
          eyebrow: row.eyebrow,
          headline: row.headline,
          description: row.description,
          discountPercent: row.discount_percent,
          buttonLabel: row.button_label,
          href: row.href
        } satisfies HomepagePromo
      ] as const;
    })
  );
  return {
    cards: [
      overrides.get('card-1') || DEFAULT_HOMEPAGE_CONTENT.cards[0],
      overrides.get('card-2') || DEFAULT_HOMEPAGE_CONTENT.cards[1],
      overrides.get('card-3') || DEFAULT_HOMEPAGE_CONTENT.cards[2]
    ],
    banner: overrides.get('banner') || DEFAULT_HOMEPAGE_CONTENT.banner
  };
}

export async function saveHomepageContent(content: HomepageContent) {
  await supabaseRequest('store_homepage_promo?on_conflict=id', {
    method: 'POST',
    headers: {
      Prefer: 'resolution=merge-duplicates,return=minimal',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(
      [
        ...content.cards.map((promo, index) => [`card-${index + 1}`, promo] as const),
        ['banner', content.banner] as const
      ].map(([id, promo]) => ({
        id,
        image_url: promo.imageUrl,
        badge_top: promo.badgeTop,
        badge_bottom: promo.badgeBottom,
        eyebrow: promo.eyebrow,
        headline: promo.headline,
        description: promo.description,
        discount_percent: promo.discountPercent,
        button_label: promo.buttonLabel,
        href: promo.href,
        updated_at: new Date().toISOString()
      }))
    )
  });
}

export async function saveCatalogProduct(update: ProductUpdate) {
  const inventoryQuantities: Record<string, number> = {};
  for (const [variantId, quantity] of Object.entries(update.inventoryQuantities)) {
    if (!Number.isInteger(quantity) || quantity < 0 || quantity > 100000) {
      throw new Error(`Inventory must be a whole number from 0 to 100,000 (${variantId}).`);
    }
    inventoryQuantities[variantId] = quantity;
  }

  await supabaseRequest('store_product_overrides?on_conflict=id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({
      id: update.id,
      title: update.title,
      description: update.description,
      price_amount: update.priceAmount,
      compare_at_amount:
        Number(update.compareAtAmount) > Number(update.priceAmount) ? update.compareAtAmount : null,
      inventory_quantities: inventoryQuantities,
      product_images: update.images,
      coupon_code: update.couponCode?.trim() || null,
      updated_at: new Date().toISOString()
    })
  });
}


/* ── Collection management ─────────────────────────── */

export type CollectionOverride = {
  handle: string;
  title: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  hidden: boolean;
  isCustom: boolean;
};

type CollectionRow = Record<string, unknown>;

function validateCollectionRow(value: unknown): CollectionOverride {
  if (!value || typeof value !== 'object') {
    throw new Error('Supabase returned an invalid collection override.');
  }
  const row = value as CollectionRow;
  if (
    typeof row.handle !== 'string' ||
    typeof row.title !== 'string' ||
    typeof row.description !== 'string' ||
    typeof row.seo_title !== 'string' ||
    typeof row.seo_description !== 'string' ||
    typeof row.hidden !== 'boolean' ||
    typeof row.is_custom !== 'boolean'
  ) {
    throw new Error('Supabase returned a malformed collection override.');
  }
  return {
    handle: row.handle,
    title: row.title,
    description: row.description,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    hidden: row.hidden,
    isCustom: row.is_custom
  };
}

const getCollectionRows = cache(async (): Promise<CollectionOverride[]> => {
  const response = await supabaseRequest(
    'store_collections?select=handle,title,description,seo_title,seo_description,hidden,is_custom'
  );
  const rows: unknown = await response.json();
  if (!Array.isArray(rows)) {
    throw new Error('Supabase returned an invalid collections response.');
  }
  return rows.map(validateCollectionRow);
});

/**
 * Merges database collection overrides with the default collections.
 * Returns all collections (including hidden) so the admin can manage them.
 */
export async function getManagedCollections(
  defaultCollections: Collection[]
): Promise<Collection[]> {
  if (!getSupabaseConfig()) return defaultCollections;

  const overrides = new Map(
    (await getCollectionRows()).map((row) => [row.handle, row] as const)
  );

  // Start with defaults, applying overrides where they exist
  const merged: Collection[] = defaultCollections.map((collection) => {
    const override = overrides.get(collection.handle);
    if (!override) return collection;
    return {
      ...collection,
      title: override.title,
      description: override.description,
      seo: {
        title: override.seoTitle || override.title,
        description: override.seoDescription || override.description
      },
      hidden: override.hidden
    };
  });

  // Add custom collections that don't exist in defaults
  for (const override of Array.from(overrides.values())) {
    if (override.isCustom && !merged.some((c) => c.handle === override.handle)) {
      merged.push({
        handle: override.handle,
        title: override.title,
        description: override.description,
        seo: {
          title: override.seoTitle || override.title,
          description: override.seoDescription || override.description
        },
        updatedAt: new Date().toISOString(),
        path: `/search/${override.handle}`,
        hidden: override.hidden
      });
    }
  }

  return merged;
}

/**
 * Saves (creates or updates) a collection override in the database.
 */
export async function saveCollectionOverride(collection: CollectionOverride): Promise<void> {
  await supabaseRequest('store_collections?on_conflict=handle', {
    method: 'POST',
    headers: {
      Prefer: 'resolution=merge-duplicates,return=minimal',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      handle: collection.handle,
      title: collection.title,
      description: collection.description,
      seo_title: collection.seoTitle,
      seo_description: collection.seoDescription,
      hidden: collection.hidden,
      is_custom: collection.isCustom,
      updated_at: new Date().toISOString()
    })
  });
}

/**
 * Deletes a collection override from the database.
 */
export async function deleteCollectionOverride(handle: string): Promise<void> {
  await supabaseRequest(`store_collections?handle=eq.${encodeURIComponent(handle)}`, {
    method: 'DELETE'
  });
}
