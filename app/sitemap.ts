import { getCollections, getPages, getProducts } from 'lib/store';
import { MetadataRoute } from 'next';

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [collections, products, pages] = await Promise.all([
    getCollections(),
    getProducts(),
    getPages()
  ]);
  return [
    { url: baseUrl, lastModified: new Date() },
    ...collections.map((collection) => ({
      url: `${baseUrl}${collection.path}`,
      lastModified: new Date(collection.updatedAt)
    })),
    ...products.map((product) => ({
      url: `${baseUrl}${product.handle}`,
      lastModified: new Date(product.updatedAt)
    })),
    ...pages.map((page) => ({
      url: `${baseUrl}/${page.handle}`,
      lastModified: new Date(page.updatedAt)
    }))
  ];
}
