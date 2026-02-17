begin;

create extension if not exists "pgcrypto";

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null default '',
  category text not null,
  sub_category text not null default '',
  sku text not null default '',
  brand text not null default 'Faith Select',
  original_price numeric(12,2) not null check (original_price > 0),
  sale_price numeric(12,2) not null check (sale_price > 0 and sale_price <= original_price),
  image text not null default '/placeholder.svg',
  in_stock boolean not null default true,
  rating numeric(3,2) not null default 4.5 check (rating >= 0 and rating <= 5),
  gallery text[] not null default '{}',
  size_options text[] not null default '{}',
  color_options text[] not null default '{}',
  quantity_options jsonb not null default '[{"id":"buy-1","title":"Buy 1","subtitle":"50% OFF","paidUnits":1,"freeUnits":0},{"id":"buy-2-get-1-free","title":"Buy 2 Get 1 Free","subtitle":"MOST POPULAR","paidUnits":2,"freeUnits":1,"badge":"MOST POPULAR"},{"id":"buy-3-get-2-free","title":"Buy 3 Get 2 Free","subtitle":"BEST VALUE","paidUnits":3,"freeUnits":2,"badge":"BEST VALUE"}]'::jsonb,
  sold integer not null default 0,
  is_new boolean not null default false,
  best_selling boolean not null default false,
  description_sw text not null default 'Bidhaa bora kwa matumizi ya kila siku, tunafikisha Tanzania nzima kwa gharama nafuu.',
  benefits_sw text[] not null default '{"Ubora wa juu uliothibitishwa","Malipo baada ya kupokea bidhaa","Tunafikisha oda Tanzania nzima kwa gharama nafuu ya usafiri"}',
  who_for_sw text not null default 'Inafaa kwa mtu yeyote anayehitaji bidhaa bora kwa bei nafuu.',
  created_at timestamptz not null default now()
);

create index if not exists idx_products_category on public.products(category);
create index if not exists idx_products_created_at on public.products(created_at desc);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  product_id text,
  product_name text,
  quantity integer not null check (quantity > 0),
  full_name text not null,
  phone text not null,
  region_city text not null,
  address text not null,
  selected_size text not null default '',
  selected_color text not null default '',
  payment_method text not null default 'cash-on-delivery' check (payment_method in ('cash-on-delivery', 'pesapal', 'bank-deposit')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'pending', 'partial', 'paid', 'failed', 'pending-verification')),
  installment_enabled boolean not null default false,
  deposit_amount numeric(12,2) not null default 0 check (deposit_amount >= 0),
  installment_notes text not null default '',
  subtotal numeric(12,2) not null default 0 check (subtotal >= 0),
  shipping_fee numeric(12,2) not null default 0 check (shipping_fee >= 0),
  shipping_label text not null default '',
  payment_reference text,
  payment_tracking_id text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'delivered', 'cancelled')),
  total numeric(12,2) not null check (total >= 0),
  created_at timestamptz not null default now()
);


create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text not null,
  rating integer not null check (rating between 1 and 5),
  comment text not null,
  customer_name text not null,
  created_at timestamptz not null default now(),
  unique(order_id)
);

create index if not exists idx_reviews_product on public.reviews(product_id);
create index if not exists idx_reviews_created_at on public.reviews(created_at desc);

create table if not exists public.customer_signups (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  email text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_customer_signups_created_at on public.customer_signups(created_at desc);

create table if not exists public.site_visits (
  id uuid primary key default gen_random_uuid(),
  path text not null default '/',
  referrer text not null default '',
  user_agent text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_site_visits_created_at on public.site_visits(created_at desc);
create index if not exists idx_site_visits_path on public.site_visits(path);

-- Backward-safe migrations
alter table public.products add column if not exists slug text not null default '';
alter table public.products add column if not exists sku text not null default '';
alter table public.products add column if not exists brand text not null default 'Faith Select';
alter table public.products add column if not exists sub_category text not null default '';
alter table public.products add column if not exists rating numeric(3,2) not null default 4.5;
alter table public.products add column if not exists gallery text[] not null default '{}';
alter table public.products add column if not exists size_options text[] not null default '{}';
alter table public.products add column if not exists color_options text[] not null default '{}';
alter table public.products add column if not exists quantity_options jsonb not null default '[{"id":"buy-1","title":"Buy 1","subtitle":"50% OFF","paidUnits":1,"freeUnits":0},{"id":"buy-2-get-1-free","title":"Buy 2 Get 1 Free","subtitle":"MOST POPULAR","paidUnits":2,"freeUnits":1,"badge":"MOST POPULAR"},{"id":"buy-3-get-2-free","title":"Buy 3 Get 2 Free","subtitle":"BEST VALUE","paidUnits":3,"freeUnits":2,"badge":"BEST VALUE"}]'::jsonb;
alter table public.products add column if not exists sold integer not null default 0;
alter table public.products add column if not exists is_new boolean not null default false;
alter table public.products add column if not exists best_selling boolean not null default false;
alter table public.products add column if not exists description_sw text not null default 'Bidhaa bora kwa matumizi ya kila siku, tunafikisha Tanzania nzima kwa gharama nafuu.';
alter table public.products add column if not exists benefits_sw text[] not null default '{"Ubora wa juu uliothibitishwa","Malipo baada ya kupokea bidhaa","Tunafikisha oda Tanzania nzima kwa gharama nafuu ya usafiri"}';
alter table public.products add column if not exists who_for_sw text not null default 'Inafaa kwa mtu yeyote anayehitaji bidhaa bora kwa bei nafuu.';

update public.products
set slug = regexp_replace(regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g'), '(^-|-$)', '', 'g')
where coalesce(slug, '') = '';

update public.products
set sku = upper(regexp_replace(coalesce(slug, name), '[^a-z0-9]+', '-', 'g'))
where coalesce(sku, '') = '';

with slug_duplicates as (
  select id, row_number() over (partition by slug order by created_at asc, id asc) as rn
  from public.products
  where coalesce(slug, '') <> ''
)
update public.products p
set slug = p.slug || '-' || right(replace(p.id::text, '-', ''), 6)
from slug_duplicates d
where p.id = d.id and d.rn > 1;

with sku_duplicates as (
  select id, row_number() over (partition by sku order by created_at asc, id asc) as rn
  from public.products
  where coalesce(sku, '') <> ''
)
update public.products p
set sku = p.sku || '-' || right(replace(p.id::text, '-', ''), 6)
from sku_duplicates d
where p.id = d.id and d.rn > 1;

alter table public.orders alter column product_id type text using product_id::text;
alter table public.orders add column if not exists selected_size text not null default '';
alter table public.orders add column if not exists selected_color text not null default '';
alter table public.orders add column if not exists payment_method text not null default 'cash-on-delivery';
alter table public.orders add column if not exists payment_status text not null default 'unpaid';
alter table public.orders add column if not exists installment_enabled boolean not null default false;
alter table public.orders add column if not exists deposit_amount numeric(12,2) not null default 0;
alter table public.orders add column if not exists installment_notes text not null default '';
alter table public.orders add column if not exists subtotal numeric(12,2) not null default 0;
alter table public.orders add column if not exists shipping_fee numeric(12,2) not null default 0;
alter table public.orders add column if not exists shipping_label text not null default '';
alter table public.orders add column if not exists payment_reference text;
alter table public.orders add column if not exists payment_tracking_id text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'orders_payment_method_check'
  ) then
    alter table public.orders
      add constraint orders_payment_method_check
      check (payment_method in ('cash-on-delivery', 'pesapal', 'bank-deposit'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'orders_payment_status_check'
  ) then
    alter table public.orders
      add constraint orders_payment_status_check
      check (payment_status in ('unpaid', 'pending', 'partial', 'paid', 'failed', 'pending-verification'));
  end if;
end
$$;

create unique index if not exists idx_products_slug_unique on public.products(slug) where slug <> '';
create unique index if not exists idx_products_sku_unique on public.products(sku) where sku <> '';
create index if not exists idx_orders_created_at on public.orders(created_at desc);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_payment_status on public.orders(payment_status);
create index if not exists idx_orders_payment_reference on public.orders(payment_reference);

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.reviews enable row level security;
alter table public.customer_signups enable row level security;
alter table public.site_visits enable row level security;

drop policy if exists products_public_read on public.products;
create policy products_public_read
on public.products
for select
to anon, authenticated
using (true);

drop policy if exists reviews_public_read on public.reviews;
create policy reviews_public_read
on public.reviews
for select
to anon, authenticated
using (true);

notify pgrst, 'reload schema';

commit;
