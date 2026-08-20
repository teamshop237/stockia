-- STOCK MOVEMENTS ------------------------------------------------------------
-- Historique des entrées/sorties de stock. Chaque ligne est un mouvement
-- immuable (jamais modifiée ni supprimée) ; la quantité courante du produit
-- reste la source de vérité pour l'affichage, mise à jour par la fonction
-- record_stock_movement ci-dessous.
create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  type text not null check (type in ('in', 'out')),
  quantity numeric not null check (quantity > 0),
  note text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.stock_movements enable row level security;

create policy "movements: select same org"
  on public.stock_movements for select
  using (organization_id = public.current_org_id());

-- Pas de policy insert/update/delete directe : toute écriture passe par
-- record_stock_movement, pour garantir que la quantité du produit et
-- l'historique restent cohérents entre eux.

-- Enregistre un mouvement et met à jour products.quantity, atomiquement.
-- SECURITY DEFINER + verrouillage de la ligne produit (for update) pour
-- éviter une lecture-écriture concurrente qui désynchroniserait la quantité.
create or replace function public.record_stock_movement(
  p_product_id uuid,
  p_type text,
  p_quantity numeric,
  p_note text default null
)
returns public.stock_movements
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_current_qty numeric;
  v_new_qty numeric;
  v_movement public.stock_movements;
begin
  v_org_id := public.current_org_id();

  if v_org_id is null then
    raise exception 'not authenticated';
  end if;

  if p_type not in ('in', 'out') then
    raise exception 'invalid movement type';
  end if;

  if p_quantity is null or p_quantity <= 0 then
    raise exception 'quantity must be positive';
  end if;

  select quantity into v_current_qty
  from public.products
  where id = p_product_id and organization_id = v_org_id
  for update;

  if not found then
    raise exception 'product not found';
  end if;

  if p_type = 'in' then
    v_new_qty := v_current_qty + p_quantity;
  else
    v_new_qty := v_current_qty - p_quantity;
    if v_new_qty < 0 then
      raise exception 'insufficient stock';
    end if;
  end if;

  update public.products
  set quantity = v_new_qty, updated_at = now()
  where id = p_product_id;

  insert into public.stock_movements (organization_id, product_id, type, quantity, note, created_by)
  values (v_org_id, p_product_id, p_type, p_quantity, p_note, auth.uid())
  returning * into v_movement;

  return v_movement;
end;
$$;

grant execute on function public.record_stock_movement(uuid, text, numeric, text) to authenticated;
