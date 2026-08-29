-- GESTION DES ADMINS DEPUIS L'INTERFACE --------------------------------------
-- La personne à promouvoir doit déjà avoir un compte StockIA (avoir signup/
-- login au moins une fois, même via un compte rattaché à une organisation) :
-- ces fonctions ne créent jamais de compte auth.users, seulement l'entrée
-- platform_admins.

create or replace function public.admin_list_platform_admins()
returns table (
  id uuid,
  email text,
  created_at timestamptz
)
language sql
security definer
stable
set search_path = public
as $$
  select pa.id, u.email, pa.created_at
  from public.platform_admins pa
  join auth.users u on u.id = pa.id
  where public.is_platform_admin()
  order by pa.created_at asc;
$$;

grant execute on function public.admin_list_platform_admins() to authenticated;

create or replace function public.admin_add_platform_admin(target_email text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_id uuid;
begin
  if not public.is_platform_admin() then
    raise exception 'not authorized';
  end if;

  select id into target_id from auth.users where email = trim(target_email);

  if target_id is null then
    raise exception 'Aucun compte StockIA trouvé avec cet email. La personne doit d''abord se connecter au moins une fois.';
  end if;

  insert into public.platform_admins (id)
  values (target_id)
  on conflict (id) do nothing;

  return target_id;
end;
$$;

grant execute on function public.admin_add_platform_admin(text) to authenticated;

create or replace function public.admin_remove_platform_admin(target_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'not authorized';
  end if;

  if target_id = auth.uid() then
    raise exception 'Impossible de se retirer soi-même.';
  end if;

  if (select count(*) from public.platform_admins) <= 1 then
    raise exception 'Impossible de retirer le dernier administrateur.';
  end if;

  delete from public.platform_admins where id = target_id;
end;
$$;

grant execute on function public.admin_remove_platform_admin(uuid) to authenticated;

-- SUPPRESSION DÉFINITIVE D'UNE ORGANISATION -----------------------------------
-- Cascade déjà en place au niveau des FK (profiles/products/stock_movements
-- référencent organizations en "on delete cascade") : supprimer la ligne
-- organizations suffit à tout nettoyer proprement.
create policy "org: platform admin delete"
  on public.organizations for delete
  using (public.is_platform_admin());
