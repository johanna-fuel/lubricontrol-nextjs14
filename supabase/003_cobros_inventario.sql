-- LubriControl: finalización, consumo de inventario, cobros y entrega.
-- Ejecutar una sola vez después de 002_catalogos_ordenes.sql.

alter table public.service_orders
  add column if not exists inventory_applied boolean not null default false,
  add column if not exists inventory_applied_at timestamptz,
  add column if not exists delivered_at timestamptz;

create index if not exists idx_payments_order_id on public.payments(order_id);
create index if not exists idx_orders_inventory_applied on public.service_orders(inventory_applied);

-- Finaliza una orden y descuenta sus productos de forma atómica e idempotente.
create or replace function public.finalize_service_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status public.order_status;
  v_inventory_applied boolean;
  v_line record;
begin
  if auth.uid() is null then
    raise exception 'Debe iniciar sesión para finalizar una orden.';
  end if;

  select status, inventory_applied
    into v_status, v_inventory_applied
  from public.service_orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'La orden no existe.';
  end if;

  if v_status = 'cancelled' then
    raise exception 'Una orden cancelada no puede finalizarse.';
  end if;

  if v_status = 'delivered' then
    raise exception 'La orden ya fue entregada.';
  end if;

  if v_inventory_applied then
    update public.service_orders
       set status = 'completed',
           completed_at = coalesce(completed_at, now())
     where id = p_order_id;
    return;
  end if;

  if v_status not in ('in_progress', 'completed') then
    raise exception 'La orden debe estar En proceso antes de finalizarla.';
  end if;

  for v_line in
    select op.product_id, op.quantity, p.name, p.stock
      from public.order_products op
      join public.products p on p.id = op.product_id
     where op.order_id = p_order_id
     for update of p
  loop
    if v_line.stock < v_line.quantity then
      raise exception 'Stock insuficiente para %: disponible %, requerido %.',
        v_line.name, v_line.stock, v_line.quantity;
    end if;
  end loop;

  update public.products p
     set stock = p.stock - op.quantity
    from public.order_products op
   where op.order_id = p_order_id
     and op.product_id = p.id;

  update public.service_orders
     set status = 'completed',
         completed_at = now(),
         inventory_applied = true,
         inventory_applied_at = now()
   where id = p_order_id;
end;
$$;

-- Entrega la orden solo cuando está finalizada y totalmente pagada.
create or replace function public.deliver_service_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status public.order_status;
  v_total numeric(12,2);
  v_paid numeric(12,2);
  v_inventory_applied boolean;
begin
  if auth.uid() is null then
    raise exception 'Debe iniciar sesión para entregar una orden.';
  end if;

  select status, total, inventory_applied
    into v_status, v_total, v_inventory_applied
  from public.service_orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'La orden no existe.';
  end if;

  if v_status = 'delivered' then
    return;
  end if;

  if v_status <> 'completed' then
    raise exception 'La orden debe estar Finalizada antes de entregarla.';
  end if;

  if not v_inventory_applied then
    raise exception 'El consumo de inventario todavía no fue aplicado.';
  end if;

  select coalesce(sum(amount), 0)
    into v_paid
  from public.payments
  where order_id = p_order_id;

  if v_paid < v_total then
    raise exception 'La orden aún tiene un saldo pendiente de pago.';
  end if;

  update public.service_orders
     set status = 'delivered',
         delivered_at = now(),
         completed_at = coalesce(completed_at, now())
   where id = p_order_id;
end;
$$;

grant execute on function public.finalize_service_order(uuid) to authenticated;
grant execute on function public.deliver_service_order(uuid) to authenticated;
