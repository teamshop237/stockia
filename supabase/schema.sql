-- ORGANIZATIONS -------------------------------------------------------------
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

alter table public.organizations enable row level security;

-- PROFILES --------------------------------------------------------------
-- Un profile = un utilisateur Supabase Auth, rattaché à une organisation.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  full_name text,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Fonction utilitaire : organisation de l'utilisateur courant.
-- security definer pour éviter la récursion RLS lors des policies.
create or replace function public.current_org_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select organization_id from public.profiles where id = auth.uid();
$$;

-- PRODUCTS ----------------------------------------------------------------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  reference text,
  quantity numeric not null default 0,
  alert_threshold numeric not null default 0,
  price numeric not null default 0,
  category text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;

-- POLICIES ------------------------------------------------------------------

-- organizations : un utilisateur ne voit que sa propre organisation.
create policy "org: select own"
  on public.organizations for select
  using (id = public.current_org_id());

-- profiles : un utilisateur voit les profils de sa propre organisation.
create policy "profiles: select same org"
  on public.profiles for select
  using (organization_id = public.current_org_id());

-- profiles : un utilisateur ne peut créer que son propre profil
-- (utilisé lors de l'inscription, après création de l'organisation).
create policy "profiles: insert self"
  on public.profiles for insert
  with check (id = auth.uid());

-- products : isolation complète par organisation, CRUD.
create policy "products: select same org"
  on public.products for select
  using (organization_id = public.current_org_id());

create policy "products: insert same org"
  on public.products for insert
  with check (organization_id = public.current_org_id());

create policy "products: update same org"
  on public.products for update
  using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

create policy "products: delete same org"
  on public.products for delete
  using (organization_id = public.current_org_id());
