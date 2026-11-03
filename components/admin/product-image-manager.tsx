'use client';

import type { Image as ProductImage } from 'lib/types';
import Image from 'next/image';
import { useState, type Dispatch, type SetStateAction } from 'react';

const maxImages = 10;
const maxSourceBytes = 20 * 1024 * 1024;
const maxOutputBytes = 8 * 1024 * 1024;
const maxDimension = 2400;
const acceptedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

type UploadResponse = {
  error?: string;
  key?: string;
  url?: string;
  uploadUrl?: string;
};

function convertToWebp(file: File): Promise<{ file: File; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    if (!acceptedTypes.has(file.type)) {
      reject(new Error('Choose a JPEG, PNG, WebP, or AVIF image.'));
      return;
    }
    if (file.size > maxSourceBytes) {
      reject(new Error('Each source image must be 20 MB or smaller.'));
      return;
    }

    createImageBitmap(file)
      .then((bitmap) => {
        const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
        const width = Math.max(1, Math.round(bitmap.width * scale));
        const height = Math.max(1, Math.round(bitmap.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        if (!context) {
          bitmap.close();
          reject(new Error('Your browser could not prepare this image for upload.'));
          return;
        }
        context.drawImage(bitmap, 0, 0, width, height);
        bitmap.close();
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Your browser could not compress this image.'));
              return;
            }
            if (blob.size > maxOutputBytes) {
              reject(new Error('The optimized image is larger than 8 MB.'));
              return;
            }
            resolve({
              file: new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.webp`, {
                type: 'image/webp',
                lastModified: Date.now()
              }),
              width,
              height
            });
          },
          'image/webp',
          0.82
        );
      })
      .catch(() => reject(new Error('This image could not be opened by your browser.')));
  });
}

export default function ProductImageManager({
  productId,
  productTitle,
  images,
  onChange,
  onUploadingChange,
  storageConfigured,
  disabled
}: {
  productId: string;
  productTitle: string;
  images: ProductImage[];
  onChange: Dispatch<SetStateAction<ProductImage[]>>;
  onUploadingChange: Dispatch<SetStateAction<boolean>>;
  storageConfigured: boolean;
  disabled: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');

  async function uploadFiles(files: File[]) {
    if (!files.length) return;
    if (images.length + files.length > maxImages) {
      setError(`A product can have at most ${maxImages} images.`);
      return;
    }

    setUploading(true);
    onUploadingChange(true);
    setError('');
    setProgress('');
    const uploadedImages = [...images];
    try {
      for (let index = 0; index < files.length; index += 1) {
        const sourceFile = files[index];
        if (!sourceFile) continue;
        setProgress(`Optimizing image ${index + 1} of ${files.length}…`);
        const optimized = await convertToWebp(sourceFile);
        setProgress(`Uploading image ${index + 1} of ${files.length}…`);

        const authorization = await fetch(
          `/api/admin/products/${encodeURIComponent(productId)}/image-upload`,
          { method: 'POST' }
        );
        const signedUpload = (await authorization.json()) as UploadResponse;
        if (
          !authorization.ok ||
          !signedUpload.uploadUrl ||
          !signedUpload.key ||
          !signedUpload.url
        ) {
          throw new Error(signedUpload.error || 'Could not authorize the B2 upload.');
        }

        const upload = await fetch(signedUpload.uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': 'image/webp',
            'Cache-Control': 'public, max-age=31536000, immutable'
          },
          body: optimized.file
        });
        if (!upload.ok) {
          throw new Error(
            `B2 rejected the image upload (HTTP ${upload.status}). Check bucket CORS settings.`
          );
        }

        uploadedImages.push({
          url: signedUpload.url,
          storageKey: signedUpload.key,
          altText: productTitle,
          width: optimized.width,
          height: optimized.height
        });
        onChange([...uploadedImages]);
      }
      setProgress(
        `${files.length} optimized ${
          files.length === 1 ? 'image' : 'images'
        } uploaded. Save the product to publish.`
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Image upload failed.');
    } finally {
      setUploading(false);
      onUploadingChange(false);
    }
  }

  return (
    <section aria-labelledby="product-images-title" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h4 id="product-images-title" className="text-[12px] font-semibold text-[#27362e]">
            Product images
          </h4>
          <p className="mt-1 text-[11px] text-[#788179]">
            Upload up to {maxImages} images. The first image is the product cover.
          </p>
        </div>
        <label className="inline-flex cursor-pointer items-center rounded-full border border-[#dce3da] bg-white px-4 py-2 text-[11px] font-semibold text-[#334239] transition-colors hover:border-[#9aad8e]">
          {uploading ? 'Uploading…' : 'Add images'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            disabled={disabled || uploading || !storageConfigured || images.length >= maxImages}
            onChange={(event) => {
              const files = Array.from(event.currentTarget.files || []);
              event.currentTarget.value = '';
              void uploadFiles(files);
            }}
            className="sr-only"
          />
        </label>
      </div>

      {!storageConfigured ? (
        <p className="rounded-lg border border-[#e4d7aa] bg-[#fbf7e9] px-3 py-2.5 text-[11px] leading-5 text-[#6c5b2c]">
          Configure the B2 settings in .env.local to enable direct, optimized image uploads.
        </p>
      ) : null}

      {images.length ? (
        <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {images.map((image, index) => (
            <li
              key={image.storageKey || image.url}
              className="flex gap-3 rounded-xl border border-[#e1e7de] bg-white p-3"
            >
              <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-[#edf0eb]">
                <Image
                  src={image.url}
                  alt={image.altText}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#526c3a]">
                  {index === 0 ? 'Cover image' : `Gallery image ${index + 1}`}
                  {image.storageKey ? ' · B2' : ' · Existing'}
                </p>
                <label className="block">
                  <span className="sr-only">Image description</span>
                  <input
                    type="text"
                    value={image.altText}
                    maxLength={200}
                    disabled={disabled || uploading}
                    onChange={(event) =>
                      onChange(
                        images.map((current, currentIndex) =>
                          currentIndex === index
                            ? { ...current, altText: event.target.value }
                            : current
                        )
                      )
                    }
                    aria-label={`Description for image ${index + 1}`}
                    className="w-full rounded-md border border-[#dce3da] px-2 py-1.5 text-[11px] text-[#17211f] outline-none focus:border-[#9aad8e]"
                  />
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    aria-label={`Make image ${index + 1} the cover`}
                    disabled={disabled || uploading || index === 0}
                    onClick={() => onChange([image, ...images.filter((_, i) => i !== index)])}
                    className="rounded-md border border-[#dce3da] px-2 py-1 text-[10px] text-[#526c3a] disabled:opacity-40"
                  >
                    Make cover
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove image ${index + 1}`}
                    disabled={disabled || uploading || images.length <= 1}
                    onClick={() => onChange(images.filter((_, i) => i !== index))}
                    className="rounded-md border border-[#ead7d2] px-2 py-1 text-[10px] text-[#9a392d] disabled:opacity-40"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="rounded-lg border border-dashed border-[#dce3da] px-4 py-6 text-center text-[12px] text-[#788179]">
          Add at least one image to this product.
        </p>
      )}

      {progress ? (
        <p role="status" className="text-[11px] text-[#526c3a]">
          {progress}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="rounded-lg bg-[#fbefec] px-3 py-2 text-[11px] text-[#9a392d]">
          {error}
        </p>
      ) : null}
      <p className="text-[10px] leading-5 text-[#788179]">
        Images are resized to at most 2400 px and converted to WebP before direct upload to B2.
        Original files are not sent to the app server.
      </p>
    </section>
  );
}
