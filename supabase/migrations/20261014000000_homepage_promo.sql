create table if not exists public.store_homepage_promo (
  id text primary key check (id = 'offer-card'),
  image_url text not null,
  badge_top text not null,
  badge_bottom text not null,
  eyebrow text not null,
  headline text not null,
  description text not null,
  discount_percent integer not null check (discount_percent between 0 and 100),
  button_label text not null,
  href text not null,
  updated_at timestamptz not null default now()
);

alter table public.store_homepage_promo enable row level security;
