-- Ajoute l'email sur profiles pour pouvoir afficher la liste de l'équipe
-- sans jamais interroger auth.users depuis le client (non exposé via l'API).
alter table public.profiles add column if not exists email text;

update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and p.email is null;

-- Met à jour la fonction d'inscription pour renseigner l'email (dérivé côté
-- serveur depuis auth.users, jamais fourni par le client).
create or replace function public.create_organization_and_profile(
  org_name text,
  member_full_name text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
  caller_email text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if exists (select 1 from public.profiles where id = auth.uid()) then
    raise exception 'profile already exists for this user';
  end if;

  if trim(org_name) = '' then
    raise exception 'organization name is required';
  end if;

  select email into caller_email from auth.users where id = auth.uid();

  insert into public.organizations (name)
  values (org_name)
  returning id into new_org_id;

  insert into public.profiles (id, organization_id, full_name, role, email)
  values (auth.uid(), new_org_id, member_full_name, 'owner', caller_email);

  return new_org_id;
end;
$$;

-- Rejoint l'organisation d'un invité, à partir des métadonnées posées par la
-- fonction Edge invite-member (jamais un organization_id fourni par le
-- client) : le seul chemin pour créer ces métadonnées passe par
-- auth.admin.inviteUserByEmail, appelé côté serveur après vérification que
-- l'appelant est bien "owner" de son organisation.
create or replace function public.join_invited_organization()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  invited_org_id uuid;
  invited_role text;
  caller_email text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if exists (select 1 from public.profiles where id = auth.uid()) then
    raise exception 'profile already exists for this user';
  end if;

  select
    (raw_user_meta_data->>'invited_org_id')::uuid,
    raw_user_meta_data->>'invited_role',
    email
  into invited_org_id, invited_role, caller_email
  from auth.users
  where id = auth.uid();

  if invited_org_id is null then
    return null;
  end if;

  if invited_role not in ('owner', 'member') then
    invited_role := 'member';
  end if;

  insert into public.profiles (id, organization_id, full_name, role, email)
  values (auth.uid(), invited_org_id, null, invited_role, caller_email);

  return invited_org_id;
end;
$$;

grant execute on function public.join_invited_organization() to authenticated;

-- Un owner peut retirer un membre non-owner de sa propre organisation.
-- La sous-requête sur profiles ne boucle pas : elle passe par les policies
-- existantes, qui s'appuient sur current_org_id() (security definer).
create policy "profiles: owner deletes member"
  on public.profiles for delete
  using (
    organization_id = public.current_org_id()
    and role <> 'owner'
    and exists (
      select 1 from public.profiles p2
      where p2.id = auth.uid() and p2.role = 'owner'
    )
  );
