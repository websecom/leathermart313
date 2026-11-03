-- Migration: Add missing columns to store_orders.
--
-- The original migration (20261017000000_store_orders.sql) created the table
-- with only the base columns. The application code in lib/orders-storage.ts
-- (saveOrder / getOrdersByEmail) references these additional columns, so the
-- INSERT was silently failing and no orders were being persisted.

alter table store_orders
  add column if not exists user_id          text,
  add column if not exists alt_phone        text,
  add column if not exists delivery_address text,
  add column if not exists delivery_city    text,
  add column if not exists delivery_state   text,
  add column if not exists delivery_pincode text,
  add column if not exists delivery_note    text,
  add column if not exists subtotal_amount  numeric,
  add column if not exists discount_amount  numeric,
  add column if not exists shipping_amount  numeric,
  add column if not exists coupon_code      text;

-- Index for "My Orders" lookup by Clerk user ID
create index if not exists store_orders_user_id_idx
  on store_orders (user_id);

-- Index for "My Orders" fallback lookup by email
create index if not exists store_orders_email_idx
  on store_orders (customer_email);
