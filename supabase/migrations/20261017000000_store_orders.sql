-- Orders table — persists customer orders created through the Cashfree checkout flow.
-- Each row is created when the payment order is created (status PENDING) and
-- updated by the Cashfree webhook when the payment succeeds or fails.

-- 1. Orders table
create table if not exists store_orders (
  order_id        text        primary key,
  customer_name   text        not null default '',
  customer_email  text        not null,
  customer_phone  text        not null,
  amount          numeric     not null check (amount > 0),
  currency        text        not null default 'INR',
  payment_status  text        not null default 'PENDING',
  items           jsonb       not null default '[]',
  total_quantity  integer     not null default 0,
  cf_order_status text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- 2. Index for admin ordering by most recent first
create index if not exists store_orders_created_at_idx
  on store_orders (created_at desc);

-- 3. Index for filtering by payment status
create index if not exists store_orders_payment_status_idx
  on store_orders (payment_status);

-- 4. Attach trigger (reuse the existing update_updated_at_column function)
drop trigger if exists set_orders_updated_at on store_orders;
create trigger set_orders_updated_at
  before update on store_orders
  for each row execute procedure update_updated_at_column();

-- 5. Disable RLS (server-side service role key handles auth)
alter table store_orders disable row level security;

-- Add admin_note column for manual order status notes
alter table store_orders add column if not exists admin_note text;
