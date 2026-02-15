begin;

create extension if not exists "pgcrypto";

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null default '',
  category text not null check (
    category in (
      'electronic',
      'fashion',
      'fashion-accessories',
      'hardware-automobile',
      'health-beauty',
      'home-living'
    )
  ),
  original_price numeric(12,2) not null check (original_price > 0),
  sale_price numeric(12,2) not null check (sale_price > 0 and sale_price <= original_price),
  image text not null default '/placeholder.svg',
  in_stock boolean not null default true,
  rating numeric(3,2) not null default 4.5 check (rating >= 0 and rating <= 5),
  gallery text[] not null default '{}',
  sold integer not null default 0,
  is_new boolean not null default false,
  best_selling boolean not null default false,
  description_sw text not null default 'Bidhaa bora kwa matumizi ya kila siku, usafirishaji bure Tanzania nzima.',
  benefits_sw text[] not null default '{"Ubora wa juu uliothibitishwa","Malipo baada ya kupokea bidhaa","Usafirishaji bure Tanzania nzima"}',
  who_for_sw text not null default 'Inafaa kwa mtu yeyote anayehitaji bidhaa bora kwa bei nafuu.',
  created_at timestamptz not null default now()
);

create index if not exists idx_products_category on public.products(category);
create index if not exists idx_products_created_at on public.products(created_at desc);
create unique index if not exists idx_products_slug_unique on public.products(slug) where slug <> '';

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  product_id text,
  product_name text,
  quantity integer not null check (quantity > 0),
  full_name text not null,
  phone text not null,
  region_city text not null,
  address text not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'delivered', 'cancelled')),
  total numeric(12,2) not null check (total >= 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_orders_created_at on public.orders(created_at desc);
create index if not exists idx_orders_status on public.orders(status);

alter table public.products add column if not exists slug text not null default '';
alter table public.products add column if not exists rating numeric(3,2) not null default 4.5;
alter table public.products add column if not exists gallery text[] not null default '{}';
alter table public.products add column if not exists sold integer not null default 0;
alter table public.products add column if not exists is_new boolean not null default false;
alter table public.products add column if not exists best_selling boolean not null default false;
alter table public.products add column if not exists description_sw text not null default 'Bidhaa bora kwa matumizi ya kila siku, usafirishaji bure Tanzania nzima.';
alter table public.products add column if not exists benefits_sw text[] not null default '{"Ubora wa juu uliothibitishwa","Malipo baada ya kupokea bidhaa","Usafirishaji bure Tanzania nzima"}';
alter table public.products add column if not exists who_for_sw text not null default 'Inafaa kwa mtu yeyote anayehitaji bidhaa bora kwa bei nafuu.';
update public.products
set slug = regexp_replace(regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g'), '(^-|-$)', '', 'g')
where coalesce(slug, '') = '';
create unique index if not exists idx_products_slug_unique on public.products(slug) where slug <> '';

alter table public.orders alter column product_id type text using product_id::text;

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

alter table public.products enable row level security;
alter table public.orders enable row level security;

drop policy if exists products_public_read on public.products;
create policy products_public_read
on public.products
for select
to anon, authenticated
using (true);

commit;
