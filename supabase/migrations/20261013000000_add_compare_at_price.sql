alter table public.store_product_overrides
  add column if not exists compare_at_amount numeric(10, 2);
