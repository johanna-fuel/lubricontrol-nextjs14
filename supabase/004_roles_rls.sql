-- LubriControl: roles, autorización y RLS final académica.
-- Ejecutar una sola vez después de 003_cobros_inventario.sql.

-- Función segura para conocer el rol activo del usuario autenticado.
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid()
    and active = true
  limit 1;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'admin', false);
$$;

create or replace function public.is_receptionist_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() in ('admin', 'receptionist'), false);
$$;

grant execute on function public.current_user_role() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_receptionist_or_admin() to authenticated;

-- Promueve el primer perfil existente a administrador solo si aún no hay administrador.
-- Sirve para el bootstrap académico sin hardcodear un correo.
do $$
begin
  if not exists (select 1 from public.profiles where role = 'admin') then
    update public.profiles
       set role = 'admin'
     where id = (
       select id from public.profiles order by created_at asc limit 1
     );
  end if;
end $$;

-- Sustituye políticas MVP por políticas por rol.
drop policy if exists "profiles read authenticated" on public.profiles;
drop policy if exists "own profile update" on public.profiles;
drop policy if exists "customers authenticated all" on public.customers;
drop policy if exists "vehicles authenticated all" on public.vehicles;
drop policy if exists "services public read" on public.services;
drop policy if exists "services authenticated write" on public.services;
drop policy if exists "products authenticated all" on public.products;
drop policy if exists "orders authenticated all" on public.service_orders;
drop policy if exists "order services authenticated all" on public.order_services;
drop policy if exists "order products authenticated all" on public.order_products;
drop policy if exists "payments authenticated all" on public.payments;

-- Perfiles: cualquier autenticado puede ver nombres/roles; solo admin modifica perfiles.
create policy "profiles authenticated read"
on public.profiles for select to authenticated
using (true);

create policy "profiles admin update"
on public.profiles for update to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Clientes: recepción/admin CRUD; técnico solo lectura.
create policy "customers authenticated read"
on public.customers for select to authenticated
using (public.current_user_role() is not null);

create policy "customers reception insert"
on public.customers for insert to authenticated
with check (public.is_receptionist_or_admin());

create policy "customers reception update"
on public.customers for update to authenticated
using (public.is_receptionist_or_admin())
with check (public.is_receptionist_or_admin());

create policy "customers reception delete"
on public.customers for delete to authenticated
using (public.is_receptionist_or_admin());

-- Vehículos: recepción/admin CRUD; técnico solo lectura.
create policy "vehicles authenticated read"
on public.vehicles for select to authenticated
using (public.current_user_role() is not null);

create policy "vehicles reception insert"
on public.vehicles for insert to authenticated
with check (public.is_receptionist_or_admin());

create policy "vehicles reception update"
on public.vehicles for update to authenticated
using (public.is_receptionist_or_admin())
with check (public.is_receptionist_or_admin());

create policy "vehicles reception delete"
on public.vehicles for delete to authenticated
using (public.is_receptionist_or_admin());

-- Servicios: lectura pública de activos; administración de catálogo solo admin.
create policy "services public active read"
on public.services for select to anon, authenticated
using (active = true or public.is_admin());

create policy "services admin insert"
on public.services for insert to authenticated
with check (public.is_admin());

create policy "services admin update"
on public.services for update to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "services admin delete"
on public.services for delete to authenticated
using (public.is_admin());

-- Productos: usuarios autenticados leen; catálogo/inventario manual solo admin.
create policy "products authenticated read"
on public.products for select to authenticated
using (public.current_user_role() is not null);

create policy "products admin insert"
on public.products for insert to authenticated
with check (public.is_admin());

create policy "products admin update"
on public.products for update to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "products admin delete"
on public.products for delete to authenticated
using (public.is_admin());

-- Órdenes: recepción/admin ven y gestionan todas; técnico ve solo las asignadas a él.
create policy "orders role read"
on public.service_orders for select to authenticated
using (
  public.is_receptionist_or_admin()
  or assigned_employee_id = auth.uid()
);

create policy "orders reception insert"
on public.service_orders for insert to authenticated
with check (public.is_receptionist_or_admin() and created_by = auth.uid());

create policy "orders reception update"
on public.service_orders for update to authenticated
using (public.is_receptionist_or_admin())
with check (public.is_receptionist_or_admin());

create policy "orders reception delete"
on public.service_orders for delete to authenticated
using (public.is_receptionist_or_admin());

-- Líneas: visibles si la orden es visible. Escritura solo recepción/admin.
create policy "order services role read"
on public.order_services for select to authenticated
using (
  exists (
    select 1 from public.service_orders so
    where so.id = order_id
      and (public.is_receptionist_or_admin() or so.assigned_employee_id = auth.uid())
  )
);

create policy "order services reception insert"
on public.order_services for insert to authenticated
with check (public.is_receptionist_or_admin());

create policy "order services reception update"
on public.order_services for update to authenticated
using (public.is_receptionist_or_admin())
with check (public.is_receptionist_or_admin());

create policy "order services reception delete"
on public.order_services for delete to authenticated
using (public.is_receptionist_or_admin());

create policy "order products role read"
on public.order_products for select to authenticated
using (
  exists (
    select 1 from public.service_orders so
    where so.id = order_id
      and (public.is_receptionist_or_admin() or so.assigned_employee_id = auth.uid())
  )
);

create policy "order products reception insert"
on public.order_products for insert to authenticated
with check (public.is_receptionist_or_admin());

create policy "order products reception update"
on public.order_products for update to authenticated
using (public.is_receptionist_or_admin())
with check (public.is_receptionist_or_admin());

create policy "order products reception delete"
on public.order_products for delete to authenticated
using (public.is_receptionist_or_admin());

-- Pagos: recepción/admin CRUD; técnico puede leer pagos de sus órdenes para ver estado.
create policy "payments role read"
on public.payments for select to authenticated
using (
  public.is_receptionist_or_admin()
  or exists (
    select 1 from public.service_orders so
    where so.id = order_id and so.assigned_employee_id = auth.uid()
  )
);

create policy "payments reception insert"
on public.payments for insert to authenticated
with check (public.is_receptionist_or_admin() and received_by = auth.uid());

create policy "payments reception delete"
on public.payments for delete to authenticated
using (public.is_receptionist_or_admin());

-- Finalización segura: recepción/admin o el técnico asignado pueden finalizar.
create or replace function public.finalize_service_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status public.order_status;
  v_inventory_applied boolean;
  v_assigned uuid;
  v_role public.user_role;
  v_line record;
begin
  if auth.uid() is null then
    raise exception 'Debe iniciar sesión para finalizar una orden.';
  end if;

  v_role := public.current_user_role();

  select status, inventory_applied, assigned_employee_id
    into v_status, v_inventory_applied, v_assigned
  from public.service_orders
  where id = p_order_id
  for update;

  if not found then raise exception 'La orden no existe.'; end if;

  if not (v_role in ('admin', 'receptionist') or (v_role = 'technician' and v_assigned = auth.uid())) then
    raise exception 'No tiene permisos para finalizar esta orden.';
  end if;

  if v_status = 'cancelled' then raise exception 'Una orden cancelada no puede finalizarse.'; end if;
  if v_status = 'delivered' then raise exception 'La orden ya fue entregada.'; end if;

  if v_inventory_applied then
    update public.service_orders
       set status = 'completed', completed_at = coalesce(completed_at, now())
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
      raise exception 'Stock insuficiente para %: disponible %, requerido %.', v_line.name, v_line.stock, v_line.quantity;
    end if;
  end loop;

  update public.products p
     set stock = p.stock - op.quantity
    from public.order_products op
   where op.order_id = p_order_id and op.product_id = p.id;

  update public.service_orders
     set status = 'completed', completed_at = now(), inventory_applied = true, inventory_applied_at = now()
   where id = p_order_id;
end;
$$;

-- El técnico asignado puede iniciar su orden sin tener UPDATE general sobre la tabla.
create or replace function public.start_assigned_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.user_role;
  v_status public.order_status;
  v_assigned uuid;
begin
  if auth.uid() is null then raise exception 'Debe iniciar sesión.'; end if;
  v_role := public.current_user_role();

  select status, assigned_employee_id into v_status, v_assigned
  from public.service_orders where id = p_order_id for update;

  if not found then raise exception 'La orden no existe.'; end if;

  if not (v_role in ('admin', 'receptionist') or (v_role = 'technician' and v_assigned = auth.uid())) then
    raise exception 'No tiene permisos para iniciar esta orden.';
  end if;

  if v_status not in ('assigned', 'pending') then
    raise exception 'La orden no está disponible para iniciar.';
  end if;

  update public.service_orders set status = 'in_progress' where id = p_order_id;
end;
$$;

-- Entrega solo recepción/admin.
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
  if auth.uid() is null then raise exception 'Debe iniciar sesión para entregar una orden.'; end if;
  if not public.is_receptionist_or_admin() then raise exception 'No tiene permisos para entregar órdenes.'; end if;

  select status, total, inventory_applied into v_status, v_total, v_inventory_applied
  from public.service_orders where id = p_order_id for update;

  if not found then raise exception 'La orden no existe.'; end if;
  if v_status = 'delivered' then return; end if;
  if v_status <> 'completed' then raise exception 'La orden debe estar Finalizada antes de entregarla.'; end if;
  if not v_inventory_applied then raise exception 'El consumo de inventario todavía no fue aplicado.'; end if;

  select coalesce(sum(amount), 0) into v_paid from public.payments where order_id = p_order_id;
  if v_paid < v_total then raise exception 'La orden aún tiene un saldo pendiente de pago.'; end if;

  update public.service_orders
     set status = 'delivered', delivered_at = now(), completed_at = coalesce(completed_at, now())
   where id = p_order_id;
end;
$$;

grant execute on function public.start_assigned_order(uuid) to authenticated;
grant execute on function public.finalize_service_order(uuid) to authenticated;
grant execute on function public.deliver_service_order(uuid) to authenticated;
