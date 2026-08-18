# StockIA

## Vision produit

StockIA est un SaaS multi-entreprises (multi-tenant) de gestion de stock, générique
et adaptable à n'importe quel secteur d'activité. Aucune donnée sectorielle ne doit
être codée en dur : les catégories de produits, les unités et le vocabulaire affiché
restent configurables/neutres, pour qu'une même base de code serve n'importe quelle
entreprise cliente sans modification.

La fonctionnalité IA est une option puissante qui enrichit le produit de base — elle
n'est jamais une dépendance obligatoire au fonctionnement du produit. Une entreprise
qui n'active pas l'IA doit avoir une expérience complète et fonctionnelle.

## Stack technique

- Frontend : React + Vite + TypeScript
- Routage : React Router
- Style : Tailwind CSS
- Backend : Supabase (Postgres + Auth + Row Level Security + Edge Functions)
- IA : Claude API (Anthropic), appelée uniquement depuis une Supabase Edge Function
  (jamais depuis le frontend — la clé API ne doit jamais être exposée au navigateur)

## Modèle multi-tenant

Chaque entreprise cliente est une `organization`. Chaque utilisateur (`profile`)
appartient à exactement une organisation. Toutes les données métier (dont
`products`) sont rattachées à une `organization_id`. L'isolation entre entreprises
est garantie côté base de données via Row Level Security (RLS) — jamais uniquement
côté frontend.

## Schéma SQL

```sql
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
```

Note d'implémentation pour l'Étape 3 (inscription) : la création de
l'organisation et du profil doit être atomique. Comme `organizations` n'a pas
de policy `insert` ouverte au public, la création se fait via la fonction
Postgres `security definer` `create_organization_and_profile` (voir
`supabase/02_signup.sql`), appelée en RPC juste après `supabase.auth.signUp`.
Elle crée l'organisation et le profil dans une seule transaction et échoue
proprement (rollback) si l'une des deux étapes échoue.

Cas limite géré : si l'inscription nécessite une confirmation par email,
`supabase.auth.signUp` ne renvoie pas de session immédiate — le RPC ne peut
donc pas être appelé tout de suite (`auth.uid()` serait nul côté serveur).
Le frontend gère ça via une page `/onboarding` : à la première connexion
après confirmation, si l'utilisateur a une session mais aucun profil, il est
redirigé vers cette page pour terminer la création de son organisation.

## Edge Function IA (Étape 6)

- Nom : `analyze-stock`
- Reçoit uniquement le JWT de l'utilisateur (auth Supabase standard).
- Récupère les produits de `current_org_id()` côté serveur (jamais transmis
  depuis le frontend, pour éviter qu'un client falsifie les données envoyées
  à l'IA).
- Appelle l'API Claude avec la clé stockée en secret d'Edge Function
  (`ANTHROPIC_API_KEY`), jamais exposée au frontend.
- Retourne une analyse structurée : produits prioritaires à réapprovisionner,
  tendances, recommandations générales.

## Variables d'environnement

- `.env.local` (dev, non commité) : `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Secrets Edge Function (configurés côté Supabase, jamais dans le repo) :
  `ANTHROPIC_API_KEY`
