alter table public.store_homepage_promo
  drop constraint if exists store_homepage_promo_id_check;

update public.store_homepage_promo
set id = 'card-2'
where id = 'offer-card';

alter table public.store_homepage_promo
  add constraint store_homepage_promo_id_check
  check (id in ('card-1', 'card-2', 'card-3', 'banner'));
