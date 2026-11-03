import 'server-only';

import {
  CopyObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

type ScwConfig = {
  bucket: string;
  client: S3Client;
  publicBaseUrl: string;
};

let cachedConfig: ScwConfig | undefined;

function getConfig(): ScwConfig {
  if (cachedConfig) return cachedConfig;

  const endpoint = process.env.SCW_ENDPOINT;
  const region = process.env.SCW_REGION;
  const bucket = process.env.SCW_BUCKET;
  const accessKeyId = process.env.SCW_ACCESS_KEY;
  const secretAccessKey = process.env.SCW_SECRET_KEY;
  const publicBaseUrl = process.env.SCW_PUBLIC_BASE_URL?.replace(/\/+$/, '');

  if (!endpoint || !region || !bucket || !accessKeyId || !secretAccessKey || !publicBaseUrl) {
    throw new Error(
      'Set SCW_ENDPOINT, SCW_REGION, SCW_BUCKET, SCW_ACCESS_KEY, SCW_SECRET_KEY, and SCW_PUBLIC_BASE_URL.'
    );
  }

  let endpointUrl: URL;
  let publicUrl: URL;
  try {
    endpointUrl = new URL(endpoint);
    publicUrl = new URL(publicBaseUrl);
  } catch {
    throw new Error('SCW_ENDPOINT and SCW_PUBLIC_BASE_URL must be valid HTTPS URLs.');
  }

  if (
    endpointUrl.protocol !== 'https:' ||
    publicUrl.protocol !== 'https:' ||
    publicUrl.search ||
    publicUrl.hash ||
    publicUrl.username ||
    publicUrl.password
  ) {
    throw new Error('Use HTTPS for SCW_ENDPOINT and SCW_PUBLIC_BASE_URL.');
  }

  cachedConfig = {
    bucket,
    publicBaseUrl,
    client: new S3Client({
      region,
      endpoint: endpointUrl.origin,
      // Scaleway uses path-style: endpoint/bucket/key
      forcePathStyle: false,
      requestChecksumCalculation: 'WHEN_REQUIRED',
      credentials: { accessKeyId, secretAccessKey }
    })
  };
  return cachedConfig;
}

export function isScwStorageConfigured(): boolean {
  return Boolean(
    process.env.SCW_ENDPOINT &&
      process.env.SCW_REGION &&
      process.env.SCW_BUCKET &&
      process.env.SCW_ACCESS_KEY &&
      process.env.SCW_SECRET_KEY &&
      process.env.SCW_PUBLIC_BASE_URL
  );
}

export function getScwPublicUrl(key: string): string {
  const config = getConfig();
  const encodedKey = key.split('/').map(encodeURIComponent).join('/');
  return `${config.publicBaseUrl}/${encodedKey}`;
}

export async function createScwImageUpload(productId: string) {
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
    url: getScwPublicUrl(key),
    uploadUrl
  };
}

export async function promoteScwImage(stagingKey: string, productId: string) {
  const config = getConfig();
  const objectName = stagingKey.split('/').at(-1);
  if (!objectName) throw new Error('Invalid staged SCW image key.');
  const key = `products/${productId}/${objectName}`;

  await config.client.send(
    new CopyObjectCommand({
      Bucket: config.bucket,
      Key: key,
      CopySource: `${config.bucket}/${stagingKey.split('/').map(encodeURIComponent).join('/')}`,
      ContentType: 'image/webp',
      CacheControl: 'public, max-age=31536000, immutable',
      MetadataDirective: 'REPLACE'
    })
  );
  return { key, url: getScwPublicUrl(key) };
}

export async function verifyScwImage(key: string): Promise<boolean> {
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

export async function deleteScwImages(keys: string[]) {
  const config = getConfig();
  await Promise.all(
    keys.map((key) =>
      config.client.send(new DeleteObjectCommand({ Bucket: config.bucket, Key: key }))
    )
  );
}
