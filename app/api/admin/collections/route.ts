import { isCurrentUserAdmin } from 'lib/admin-auth';
import {
    deleteCollectionOverride,
    saveCollectionOverride,
    type CollectionOverride
} from 'lib/catalog-storage';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const runtime = 'nodejs';

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function validateHandle(handle: unknown): string | null {
  if (typeof handle !== 'string' || !handle.trim()) return null;
  const slug = handle
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
  return slug.length >= 2 && slug.length <= 60 ? slug : null;
}

/** PUT — create or update a collection */
export async function PUT(request: Request) {
  if (!(await isCurrentUserAdmin())) {
    return jsonError('Admin access required.', 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Request body must be valid JSON.', 400);
  }

  if (!body || typeof body !== 'object') {
    return jsonError('Invalid collection data.', 400);
  }

  const values = body as Record<string, unknown>;
  const handle = validateHandle(values.handle);
  if (!handle) {
    return jsonError('A valid handle (2–60 chars, lowercase letters and hyphens) is required.', 400);
  }

  const title = typeof values.title === 'string' ? values.title.trim() : '';
  const description = typeof values.description === 'string' ? values.description.trim() : '';
  if (!title || title.length > 80) {
    return jsonError('Title is required and must be 80 characters or fewer.', 400);
  }
  if (description.length > 300) {
    return jsonError('Description must be 300 characters or fewer.', 400);
  }

  const seoTitle = typeof values.seoTitle === 'string' ? values.seoTitle.trim() : title;
  const seoDescription =
    typeof values.seoDescription === 'string' ? values.seoDescription.trim() : description;
  const hidden = values.hidden === true;
  const isCustom = values.isCustom === true;

  const collection: CollectionOverride = {
    handle,
    title,
    description,
    seoTitle,
    seoDescription,
    hidden,
    isCustom
  };

  try {
    await saveCollectionOverride(collection);
  } catch (error) {
    console.error('Failed to save collection override.', error);
    return jsonError(
      'Could not save the collection. Check Supabase configuration and migration setup.',
      502
    );
  }

  revalidatePath('/');
  revalidatePath('/search');
  revalidatePath(`/search/${handle}`);
  return NextResponse.json({ saved: true });
}

/** DELETE — remove a collection override */
export async function DELETE(request: Request) {
  if (!(await isCurrentUserAdmin())) {
    return jsonError('Admin access required.', 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Request body must be valid JSON.', 400);
  }

  const values = body as Record<string, unknown>;
  const handle = validateHandle(values.handle);
  if (!handle) {
    return jsonError('A valid collection handle is required.', 400);
  }

  try {
    await deleteCollectionOverride(handle);
  } catch (error) {
    console.error('Failed to delete collection override.', error);
    return jsonError(
      'Could not delete the collection. Check Supabase configuration.',
      502
    );
  }

  revalidatePath('/');
  revalidatePath('/search');
  revalidatePath(`/search/${handle}`);
  return NextResponse.json({ deleted: true });
}
