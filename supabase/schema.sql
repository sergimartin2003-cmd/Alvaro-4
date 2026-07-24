-- ============================================================
--  HIPOPICK — Esquema de base de datos para Supabase
--  Cómo usarlo:
--    Supabase → SQL Editor → New query → pega TODO esto → Run
--  Es idempotente: puedes ejecutarlo varias veces sin problema.
-- ============================================================

-- ---------- Tabla de productos ----------
create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  price       numeric,
  currency    text default '€',
  category    text default 'Otros',
  badge       text default '',           -- guarda las TALLAS (ej: "S, M, L")
  description text default '',
  buy_link    text default '',
  images      jsonb default '[]'::jsonb,   -- lista de URLs de fotos
  rating      numeric,
  created_at  timestamptz default now()
);

alter table public.products enable row level security;

-- Lectura pública (cualquiera puede ver la tienda)
drop policy if exists "public_read_products" on public.products;
create policy "public_read_products"
  on public.products for select
  using (true);

-- Escritura solo para usuarios autenticados (tú, tras iniciar sesión)
drop policy if exists "auth_insert_products" on public.products;
create policy "auth_insert_products"
  on public.products for insert
  to authenticated with check (true);

drop policy if exists "auth_update_products" on public.products;
create policy "auth_update_products"
  on public.products for update
  to authenticated using (true) with check (true);

drop policy if exists "auth_delete_products" on public.products;
create policy "auth_delete_products"
  on public.products for delete
  to authenticated using (true);


-- ---------- Storage: bucket para las fotos ----------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

-- Lectura pública de las imágenes
drop policy if exists "public_read_images" on storage.objects;
create policy "public_read_images"
  on storage.objects for select
  using (bucket_id = 'product-images');

-- Subida / cambio / borrado de imágenes solo autenticado
drop policy if exists "auth_upload_images" on storage.objects;
create policy "auth_upload_images"
  on storage.objects for insert
  to authenticated with check (bucket_id = 'product-images');

drop policy if exists "auth_update_images" on storage.objects;
create policy "auth_update_images"
  on storage.objects for update
  to authenticated using (bucket_id = 'product-images');

drop policy if exists "auth_delete_images" on storage.objects;
create policy "auth_delete_images"
  on storage.objects for delete
  to authenticated using (bucket_id = 'product-images');

-- ============================================================
--  DESPUÉS DE EJECUTAR ESTO:
--  1) Ve a  Authentication → Users → "Add user"
--     y crea TU usuario admin (email + contraseña).
--     Ese será el único que pueda entrar al panel a subir productos.
--  2) (Opcional pero recomendado) Authentication → Providers → Email
--     desactiva "Enable Sign Ups" para que nadie más pueda registrarse.
--  3) Pega tu URL y anon key en  js/config.js
-- ============================================================
