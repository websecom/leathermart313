import { isCurrentUserAdmin } from 'lib/admin-auth';
import { isCatalogDatabaseConfigured } from 'lib/catalog-storage';
import { createScwImageUpload, isScwStorageConfigured } from 'lib/scw-storage';
import { getProducts } from 'lib/store';
import type { Product } from 'lib/types';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 401 });
  }

  if (!isCatalogDatabaseConfigured()) {
    return NextResponse.json(
      { error: 'Configure Supabase before uploading product images.' },
      { status: 503 }
    );
  }

  if (!isScwStorageConfigured()) {
    return NextResponse.json(
      { error: 'Scaleway Object Storage is not configured.' },
      { status: 503 }
    );
  }

  let products: Product[];
  try {
    products = await getProducts();
  } catch (error) {
    console.error('Failed to load catalog before creating a Scaleway upload URL.', error);
    return NextResponse.json(
      { error: 'Could not verify the product for this upload.' },
      { status: 502 }
    );
  }
  if (!products.some((product) => product.id === params.id)) {
    return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
  }

  try {
    return NextResponse.json(await createScwImageUpload(params.id));
  } catch (error) {
    console.error('Failed to create a Scaleway image upload URL.', error);
    return NextResponse.json(
      { error: 'Scaleway Object Storage is not configured correctly.' },
      { status: 503 }
    );
  }
}
