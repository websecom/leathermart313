create table if not exists public.store_product_overrides (
  id text primary key,
  title text not null,
  description text not null,
  price_amount numeric(10, 2) not null check (price_amount > 0),
  inventory_quantities jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.store_product_overrides enable row level security;
