alter table public.store_product_overrides
  add column if not exists product_images jsonb;
