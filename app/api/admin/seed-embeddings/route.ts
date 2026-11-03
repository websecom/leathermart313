import { isCurrentUserAdmin } from 'lib/admin-auth';
import { getProducts } from 'lib/store';
import { seedProductEmbeddings, getEmbeddingCount } from 'lib/vector-search';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60; // embeddings take a few seconds per product

export async function POST() {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 401 });
  }

  try {
    const products = await getProducts();
    const { seeded, errors } = await seedProductEmbeddings(products);

    return NextResponse.json({
      success: true,
      seeded,
      total: products.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('[seed-embeddings]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Seeding failed.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 401 });
  }
  const count = await getEmbeddingCount();
  return NextResponse.json({ count });
}
