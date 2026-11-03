import 'server-only';

import {
  CopyObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

type B2Config = {
  bucket: string;
  client: S3Client;
  publicBaseUrl: string;
};

let cachedConfig: B2Config | undefined;

function getConfig(): B2Config {
  if (cachedConfig) return cachedConfig;

  const endpoint = process.env.B2_ENDPOINT;
  const region = process.env.B2_REGION;
  const bucket = process.env.B2_BUCKET;
  const accessKeyId = process.env.B2_KEY_ID;
  const secretAccessKey = process.env.B2_APPLICATION_KEY;
  const publicBaseUrl = process.env.B2_PUBLIC_BASE_URL?.replace(/\/+$/, '');

  if (!endpoint || !region || !bucket || !accessKeyId || !secretAccessKey || !publicBaseUrl) {
    throw new Error(
      'Set B2_ENDPOINT, B2_REGION, B2_BUCKET, B2_KEY_ID, B2_APPLICATION_KEY, and B2_PUBLIC_BASE_URL.'
    );
  }

  let endpointUrl: URL;
  let publicUrl: URL;
  try {
    endpointUrl = new URL(endpoint);
    publicUrl = new URL(publicBaseUrl);
  } catch {
    throw new Error('B2_ENDPOINT and B2_PUBLIC_BASE_URL must be valid URLs.');
  }
  if (
    endpointUrl.protocol !== 'https:' ||
    endpointUrl.pathname !== '/' ||
    endpointUrl.search ||
    endpointUrl.hash ||
    publicUrl.protocol !== 'https:' ||
    publicUrl.search ||
    publicUrl.hash ||
    publicUrl.username ||
    publicUrl.password
  ) {
    throw new Error('Use an HTTPS B2 endpoint and HTTPS public base URL without query strings.');
  }

  cachedConfig = {
    bucket,
    publicBaseUrl,
    client: new S3Client({
      region,
      endpoint: endpointUrl.origin,
      forcePathStyle: true,
      requestChecksumCalculation: 'WHEN_REQUIRED',
      credentials: { accessKeyId, secretAccessKey }
    })
  };
  return cachedConfig;
}

export function isB2StorageConfigured(): boolean {
  return Boolean(
    process.env.B2_ENDPOINT &&
      process.env.B2_REGION &&
      process.env.B2_BUCKET &&
      process.env.B2_KEY_ID &&
      process.env.B2_APPLICATION_KEY &&
      process.env.B2_PUBLIC_BASE_URL
  );
}

export function getB2PublicUrl(key: string): string {
  const config = getConfig();
  const encodedKey = key.split('/').map(encodeURIComponent).join('/');
  return `${config.publicBaseUrl}/${encodedKey}`;
}

export async function createB2ImageUpload(productId: string) {
  const config = getConfig();
  const key = `staging/products/${productId}/${crypto.randomUUID()}.webp`;
  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    ContentType: 'image/webp',
    CacheControl: 'public, max-age=31536000, immutable'
  });
  const uploadUrl = await getSignedUrl(config.client, command, { expiresIn: 300 });

  return {
    key,
    url: getB2PublicUrl(key),
    uploadUrl
  };
}

export async function promoteB2Image(stagingKey: string, productId: string) {
  const config = getConfig();
  const objectName = stagingKey.split('/').at(-1);
  if (!objectName) throw new Error('Invalid staged B2 image key.');
  const key = `products/${productId}/${objectName}`;
  const copySource = `${config.bucket}/${stagingKey.split('/').map(encodeURIComponent).join('/')}`;
  await config.client.send(
    new CopyObjectCommand({
      Bucket: config.bucket,
      Key: key,
      CopySource: copySource,
      ContentType: 'image/webp',
      CacheControl: 'public, max-age=31536000, immutable',
      MetadataDirective: 'REPLACE'
    })
  );
  return { key, url: getB2PublicUrl(key) };
}

export async function verifyB2Image(key: string): Promise<boolean> {
  const config = getConfig();
  try {
    const result = await config.client.send(
      new HeadObjectCommand({ Bucket: config.bucket, Key: key })
    );
    return (
      result.ContentType === 'image/webp' &&
      typeof result.ContentLength === 'number' &&
      result.ContentLength > 0 &&
      result.ContentLength <= 8 * 1024 * 1024
    );
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'name' in error &&
      (error.name === 'NotFound' || error.name === 'NoSuchKey')
    ) {
      return false;
    }
    throw error;
  }
}

export async function deleteB2Images(keys: string[]) {
  const config = getConfig();
  await Promise.all(
    keys.map((key) =>
      config.client.send(new DeleteObjectCommand({ Bucket: config.bucket, Key: key }))
    )
  );
}
