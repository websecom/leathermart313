import { isCurrentUserAdmin } from 'lib/admin-auth';
import {
    saveHomepageContent,
    type HomepageContent,
    type HomepagePromo
} from 'lib/catalog-storage';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const runtime = 'nodejs';

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

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
  if (!body || typeof body !== 'object')
    return jsonError('Invalid homepage promotion settings.', 400);
  const values = body as Record<string, unknown>;
  const cards = values.cards;
  const banner = values.banner;
  if (!Array.isArray(cards) || cards.length !== 3 || !banner || typeof banner !== 'object') {
    return jsonError('Provide settings for all three cards and the animated banner.', 400);
  }

  const textFields = [
    'badgeTop',
    'badgeBottom',
    'eyebrow',
    'headline',
    'description',
    'buttonLabel',
    'imageUrl',
    'href'
  ] as const;
  const promoValues: unknown[] = [...cards, banner];
  if (
    promoValues.some(
      (candidate) => !candidate || typeof candidate !== 'object' || Array.isArray(candidate)
    )
  ) {
    return jsonError('Each homepage promotion must be a valid object.', 400);
  }
  const limits: Record<(typeof textFields)[number], number> = {
    badgeTop: 30,
    badgeBottom: 30,
    eyebrow: 90,
    headline: 90,
    description: 180,
    buttonLabel: 32,
    imageUrl: 2048,
    href: 256
  };
  if (
    promoValues.some((candidate) => {
      const promo = candidate as Record<string, unknown>;
      return (
        textFields.some((field) => typeof promo[field] !== 'string') ||
        typeof promo.discountPercent !== 'number'
      );
    })
  ) {
    return jsonError('Complete every homepage promotion field with valid text.', 400);
  }
  const promos: HomepagePromo[] = promoValues.map((candidate) => {
    const promo = candidate as Record<string, unknown>;
    return {
      imageUrl: (promo.imageUrl as string).trim(),
      badgeTop: (promo.badgeTop as string).trim(),
      badgeBottom: (promo.badgeBottom as string).trim(),
      eyebrow: (promo.eyebrow as string).trim(),
      headline: (promo.headline as string).trim(),
      description: (promo.description as string).trim(),
      discountPercent: Number(promo.discountPercent),
      buttonLabel: (promo.buttonLabel as string).trim(),
      href: (promo.href as string).trim()
    };
  });
  for (const promo of promos) {
    if (
      textFields.some((field) => !promo[field] || promo[field].length > limits[field]) ||
      !Number.isInteger(promo.discountPercent) ||
      promo.discountPercent < 0 ||
      promo.discountPercent > 100
    ) {
      return jsonError(
        'Check required fields and limits. Discount must be a whole number from 0 to 100.',
        400
      );
    }
    let imageUrl: URL;
    try {
      imageUrl = new URL(promo.imageUrl);
    } catch {
      return jsonError('Every promotion image must be a valid HTTPS URL.', 400);
    }
    if (imageUrl.protocol !== 'https:')
      return jsonError('Every promotion image must use HTTPS.', 400);
    if (!promo.href.startsWith('/') || promo.href.startsWith('//') || promo.href.includes('\\')) {
      return jsonError('Every button destination must be a same-site path, such as /search.', 400);
    }
    promo.imageUrl = imageUrl.href.replace(/[()]/g, encodeURIComponent);
  }
  const [firstCard, secondCard, thirdCard, bannerPromo] = promos;
  if (!firstCard || !secondCard || !thirdCard || !bannerPromo) {
    return jsonError('Homepage promotion settings are incomplete.', 400);
  }
  const content: HomepageContent = {
    cards: [firstCard, secondCard, thirdCard],
    banner: bannerPromo
  };

  try {
    await saveHomepageContent(content);
  } catch (error) {
    console.error('Failed to save homepage promotion settings.', error);
    return jsonError(
      'Could not save homepage promotions. Check Supabase configuration and migration setup.',
      502
    );
  }

  revalidatePath('/');
  return NextResponse.json({ saved: true });
}
