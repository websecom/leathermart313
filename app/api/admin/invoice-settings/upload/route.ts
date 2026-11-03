import { isCurrentUserAdmin } from 'lib/admin-auth';
import { isScwStorageConfigured, getScwPublicUrl } from 'lib/scw-storage';
import {
  S3Client,
  PutObjectCommand
} from '@aws-sdk/client-s3';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

function getScwClient() {
  const endpoint = process.env.SCW_ENDPOINT?.replace(/\/+$/, '');
  const region = process.env.SCW_REGION;
  const accessKeyId = process.env.SCW_ACCESS_KEY;
  const secretAccessKey = process.env.SCW_SECRET_KEY;
  const bucket = process.env.SCW_BUCKET;
  if (!endpoint || !region || !accessKeyId || !secretAccessKey || !bucket) return null;
  return {
    bucket,
    client: new S3Client({
      region,
      endpoint,
      forcePathStyle: false,
      requestChecksumCalculation: 'WHEN_REQUIRED' as const,
      credentials: { accessKeyId, secretAccessKey }
    })
  };
}

/**
 * POST /api/admin/invoice-settings/upload
 * Accepts multipart form with field "file" and "type" (qr | signature)
 * Uploads to Scaleway and returns the public URL.
 */
export async function POST(request: NextRequest) {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 401 });
  }

  if (!isScwStorageConfigured()) {
    return NextResponse.json(
      { error: 'Scaleway storage is not configured.' },
      { status: 503 }
    );
  }

  const scw = getScwClient();
  if (!scw) {
    return NextResponse.json({ error: 'Storage configuration error.' }, { status: 503 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data.' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;
  const type = formData.get('type') as string | null;

  if (!file) return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
  if (!['qr', 'signature'].includes(type ?? '')) {
    return NextResponse.json({ error: 'type must be "qr" or "signature".' }, { status: 400 });
  }

  const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
  if (!allowedTypes.has(file.type)) {
    return NextResponse.json({ error: 'Only JPEG, PNG, WebP, or GIF images are allowed.' }, { status: 400 });
  }
  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: 'File must be smaller than 2 MB.' }, { status: 400 });
  }

  const ext = file.type.split('/')[1] ?? 'png';
  const key = `invoice/${type}-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    await scw.client.send(
      new PutObjectCommand({
        Bucket: scw.bucket,
        Key: key,
        Body: buffer,
        ContentType: file.type,
        CacheControl: 'public, max-age=31536000, immutable',
        ACL: 'public-read'
      })
    );
  } catch (err) {
    console.error('[invoice-upload] Scaleway upload error:', err);
    return NextResponse.json(
      { error: 'Upload to storage failed. Check Scaleway configuration.' },
      { status: 502 }
    );
  }

  const url = getScwPublicUrl(key);
  return NextResponse.json({ url });
}
