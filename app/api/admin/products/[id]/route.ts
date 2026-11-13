import { isCurrentUserAdmin } from 'lib/admin-auth';
import { saveCatalogProduct } from 'lib/catalog-storage';
import {
    deleteScwImages,
    getScwPublicUrl,
    isScwStorageConfigured,
    promoteScwImage,
    verifyScwImage
} from 'lib/scw-storage';
import { getProducts } from 'lib/store';
import type { Image, Product } from 'lib/types';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  if (!(await isCurrentUserAdmin())) return jsonError('Admin access required.', 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Request body must be valid JSON.', 400);
  }
  if (!body || typeof body !== 'object') return jsonError('Invalid product update.', 400);

  const payload = body as Record<string, unknown>;
  let products: Product[];
  try {
    products = await getProducts();
  } catch (error) {
    console.error('Failed to load catalog while saving product.', error);
    return jsonError(
      'Could not load the catalog from Supabase. Check the database configuration.',
      502
    );
  }
  const product = products.find((item) => item.id === params.id);
  if (!product) return jsonError('Product not found.', 404);

  const title = payload.title;
  const description = payload.description;
  const priceAmount = payload.priceAmount;
  const compareAtAmount = payload.compareAtAmount;
  const couponCode = typeof payload.couponCode === 'string' ? payload.couponCode : '';
  const inventory = payload.inventoryQuantities;
  const submittedImages = payload.images;
  if (
    typeof title !== 'string' ||
    !title.trim() ||
    title.length > 160 ||
    typeof description !== 'string' ||
    !description.trim() ||
    description.length > 5000 ||
    typeof priceAmount !== 'string' ||
    !/^\d{1,8}(\.\d{1,2})?$/.test(priceAmount) ||
    Number(priceAmount) <= 0 ||
    typeof compareAtAmount !== 'string' ||
    (compareAtAmount !== '' &&
      (!/^\d{1,8}(\.\d{1,2})?$/.test(compareAtAmount) ||
        Number(compareAtAmount) < Number(priceAmount))) ||
    !inventory ||
    typeof inventory !== 'object' ||
    Array.isArray(inventory) ||
    !Array.isArray(submittedImages) ||
    submittedImages.length < 1 ||
    submittedImages.length > 10
  ) {
    return jsonError(
      'Provide a valid title, description, positive price, variant inventory, and 1 to 10 product images.',
      400
    );
  }

  const inventoryQuantities: Record<string, number> = {};
  const submittedInventory = inventory as Record<string, unknown>;
  for (const variant of product.variants) {
    const quantity = submittedInventory[variant.id];
    if (
      typeof quantity !== 'number' ||
      !Number.isInteger(quantity) ||
      quantity < 0 ||
      quantity > 100000
    ) {
      return jsonError(
        `Inventory for ${variant.title} must be a whole number from 0 to 100,000.`,
        400
      );
    }
    inventoryQuantities[variant.id] = quantity;
  }

  if (Object.keys(submittedInventory).length !== product.variants.length) {
    return jsonError('Inventory must include every product variant.', 400);
  }

  const images: Image[] = [];
  const storageKeys = new Set<string>();
  const stagingKeys: string[] = [];
  for (const candidate of submittedImages) {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
      return jsonError('Every product image must be a valid image record.', 400);
    }
    const image = candidate as Record<string, unknown>;
    if (
      typeof image.url !== 'string' ||
      typeof image.altText !== 'string' ||
      !image.altText.trim() ||
      image.altText.length > 200 ||
      typeof image.width !== 'number' ||
      !Number.isInteger(image.width) ||
      image.width < 1 ||
      image.width > 2400 ||
      typeof image.height !== 'number' ||
      !Number.isInteger(image.height) ||
      image.height < 1 ||
      image.height > 2400 ||
      (image.storageKey !== undefined && typeof image.storageKey !== 'string')
    ) {
      return jsonError('Product images need valid HTTPS URLs, alt text, and dimensions.', 400);
    }

    let url: URL;
    try {
      url = new URL(image.url);
    } catch {
      return jsonError('Every product image URL must be valid.', 400);
    }
    if (url.protocol !== 'https:') {
      return jsonError('Every product image URL must use HTTPS.', 400);
    }

    const existingImage = product.images.find((current) => current.url === image.url);
    if (typeof image.storageKey === 'string') {
      const key = image.storageKey;
      const isStagedUpload = key.startsWith(`staging/products/${product.id}/`);
      const isSavedUpload = key.startsWith(`products/${product.id}/`);
      if (
        (!isStagedUpload && !isSavedUpload) ||
        !/^(?:staging\/)?products\/[a-z0-9-]+\/[0-9a-f-]{36}\.webp$/.test(key) ||
        storageKeys.has(key) ||
        !isScwStorageConfigured()
      ) {
        return jsonError('A product image is not a valid Scaleway upload for this product.', 400);
      }
      let canonicalUrl: string;
      try {
        canonicalUrl = getScwPublicUrl(key);
      } catch {
        return jsonError('Scaleway Object Storage is not configured correctly.', 503);
      }
      if (image.url !== canonicalUrl) {
        return jsonError('The product image URL does not match its B2 object key.', 400);
      }
      if (isStagedUpload && existingImage) {
        return jsonError('A staged upload cannot replace an already-saved image reference.', 400);
      }
      if (isSavedUpload && (!existingImage || existingImage.storageKey !== key)) {
        return jsonError('The B2 object key does not match this saved product image.', 400);
      }
      storageKeys.add(key);
      if (isStagedUpload) stagingKeys.push(key);
      images.push({
        url: image.url,
        altText: image.altText.trim(),
        width: image.width,
        height: image.height,
        storageKey: key
      });
      continue;
    }

    if (!existingImage || existingImage.storageKey) {
      // Allow any valid HTTPS URL (Backblaze public URLs, Unsplash, CDN, etc.)
      // as long as it has no storageKey — external URLs are stored as-is.
    }
    images.push({
      url: image.url,
      altText: image.altText.trim(),
      width: image.width,
      height: image.height
    });
  }

  try {
    const uploadedObjectsExist = await Promise.all(stagingKeys.map(verifyScwImage));
    if (uploadedObjectsExist.some((exists) => !exists)) {
      return jsonError('One or more uploaded Scaleway images could not be verified.', 400);
    }
  } catch (error) {
    console.error('Failed to verify uploaded Scaleway product images.', error);
    return jsonError('Could not verify the uploaded product images in Scaleway.', 502);
  }

  const promotedKeys: string[] = [];
  const savedImages: Image[] = [];
  try {
    for (const image of images) {
      if (image.storageKey?.startsWith(`staging/products/${product.id}/`)) {
        const promoted = await promoteScwImage(image.storageKey, product.id);
        promotedKeys.push(promoted.key);
        savedImages.push({ ...image, storageKey: promoted.key, url: promoted.url });
      } else {
        savedImages.push(image);
      }
    }
  } catch (error) {
    console.error('Failed to promote staged Scaleway product images.', error);
    if (promotedKeys.length) {
      try {
        await deleteScwImages(promotedKeys);
      } catch (cleanupError) {
        console.error('Failed to clean up partially promoted Scaleway product images.', cleanupError);
      }
    }
    return jsonError('Could not prepare the uploaded product images for publishing.', 502);
  }

  const removedImageKeys = product.images
    .flatMap((image) => (image.storageKey ? [image.storageKey] : []))
    .filter((key) => !storageKeys.has(key));

  try {
    await saveCatalogProduct({
      id: product.id,
      title: title.trim(),
      description: description.trim(),
      priceAmount: Number(priceAmount).toFixed(2),
      compareAtAmount: compareAtAmount
        ? Number(compareAtAmount).toFixed(2)
        : Number(priceAmount).toFixed(2),
      inventoryQuantities,
      images: savedImages,
      couponCode: couponCode.trim() || undefined
    });
  } catch (error) {
    console.error('Failed to save product to Supabase.', error);
    return jsonError(
      'Could not save the product to Supabase. Check the server configuration and database table.',
      502
    );
  }

  let cleanupWarning: string | undefined;
  const cleanupKeys = Array.from(new Set([...removedImageKeys, ...stagingKeys]));
  if (cleanupKeys.length) {
    try {
      await deleteScwImages(cleanupKeys);
    } catch (error) {
      console.error(
        'Product was saved, but removed Scaleway product images could not be deleted.',
        error
      );
      cleanupWarning = 'Product saved, but some removed images could not be deleted from Scaleway.';
    }
  }

  revalidatePath('/', 'layout');
  return NextResponse.json({ saved: true, cleanupWarning });
}
