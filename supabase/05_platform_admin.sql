-- PLATFORM ADMINS ------------------------------------------------------------
-- Staff StockIA, complètement distinct du modèle multi-tenant : un platform
-- admin n'a pas d'organisation ni de "profile", et peut voir toutes les
-- organisations (support/modération). Aucune policy sur cette table : elle
-- n'est jamais lue/écrite directement par le client, uniquement via la
-- fonction security definer is_platform_admin() ci-dessous. Il n'y a pas de
-- chemin applicatif pour s'auto-promouvoir : le premier admin s'ajoute à la
-- main, par exemple :
--   insert into public.platform_admins (id)
--   values ('<uuid auth.users de la personne concernée>');
create table public.platform_admins (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.platform_admins enable row level security;

create or replace function public.is_platform_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from public.platform_admins where id = auth.uid());
$$;

grant execute on function public.is_platform_admin() to authenticated;

-- SUSPENSION D'ORGANISATION --------------------------------------------------
alter table public.organizations add column if not exists suspended boolean not null default false;

-- current_org_id() devient null pour une organisation suspendue : comme
-- quasiment toutes les policies (et record_stock_movement) reposent sur cette
-- fonction, une organisation suspendue perd immédiatement tout accès en
-- lecture/écriture à ses propres données, sans avoir à toucher chaque policy
-- individuellement.
create or replace function public.current_org_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select p.organization_id
  from public.profiles p
  join public.organizations o on o.id = p.organization_id
  where p.id = auth.uid() and o.suspended = false;
$$;

-- ACCÈS ADMIN AUX DONNÉES DES ORGANISATIONS ----------------------------------
-- Policies additionnelles (permissives, donc combinées en OR avec les
-- policies "same org" existantes) : un platform admin peut lire toutes les
-- organisations/profiles/products, et modifier une organisation (utilisé pour
-- suspendre/réactiver).
create policy "org: platform admin select all"
  on public.organizations for select
  using (public.is_platform_admin());

create policy "org: platform admin update"
  on public.organizations for update
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create policy "profiles: platform admin select all"
  on public.profiles for select
  using (public.is_platform_admin());

create policy "products: platform admin select all"
  on public.products for select
  using (public.is_platform_admin());

-- Liste agrégée des organisations pour le tableau de bord admin (évite de
-- rapatrier tous les profiles/products côté client pour compter).
create or replace function public.admin_list_organizations()
returns table (
  id uuid,
  name text,
  suspended boolean,
  created_at timestamptz,
  member_count bigint,
  product_count bigint
)
language sql
security definer
stable
set search_path = public
as $$
  select
    o.id,
    o.name,
    o.suspended,
    o.created_at,
    (select count(*) from public.profiles p where p.organization_id = o.id) as member_count,
    (select count(*) from public.products pr where pr.organization_id = o.id) as product_count
  from public.organizations o
  where public.is_platform_admin()
  order by o.created_at desc;
$$;

grant execute on function public.admin_list_organizations() to authenticated;
