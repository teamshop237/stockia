-- Création atomique d'une organisation + du profil "owner" associé.
-- SECURITY DEFINER : contourne volontairement le RLS (aucune policy insert
-- n'existe sur organizations), mais reste sûr car auth.uid() est vérifié en
-- interne et un utilisateur ne peut créer un profil que pour lui-même.
-- Toute erreur (ex: contrainte violée) fait rollback des deux inserts : on
-- ne peut jamais se retrouver avec une organisation sans profil ou l'inverse.
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

  insert into public.organizations (name)
  values (org_name)
  returning id into new_org_id;

  insert into public.profiles (id, organization_id, full_name, role)
  values (auth.uid(), new_org_id, member_full_name, 'owner');

  return new_org_id;
end;
$$;

grant execute on function public.create_organization_and_profile(text, text) to authenticated;
