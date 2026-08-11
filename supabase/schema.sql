-- LubriControl: esquema inicial para Supabase/PostgreSQL
create extension if not exists pgcrypto;

create type public.user_role as enum ('admin', 'receptionist', 'technician');
create type public.order_status as enum ('pending', 'assigned', 'in_progress', 'completed', 'delivered', 'cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role public.user_role not null default 'technician',
  phone text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  identification text unique,
  full_name text not null,
  phone text,
  email text,
  address text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  plate text not null unique,
  vin text,
  brand text not null,
  model text not null,
  year integer check (year between 1900 and 2100),
  color text,
  current_mileage integer check (current_mileage >= 0),
  created_at timestamptz not null default now()
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(12,2) not null default 0 check (price >= 0),
  active boolean not null default true
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  brand text,
  name text not null,
  viscosity text,
  presentation text,
  sale_price numeric(12,2) not null default 0 check (sale_price >= 0),
  stock numeric(12,2) not null default 0 check (stock >= 0),
  active boolean not null default true
);

create table public.service_orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity unique,
  customer_id uuid not null references public.customers(id),
  vehicle_id uuid not null references public.vehicles(id),
  assigned_employee_id uuid references public.profiles(id),
  status public.order_status not null default 'pending',
  mileage integer check (mileage >= 0),
  observations text,
  subtotal numeric(12,2) not null default 0,
  tax numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.order_services (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.service_orders(id) on delete cascade,
  service_id uuid not null references public.services(id),
  quantity numeric(12,2) not null default 1 check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  subtotal numeric(12,2) generated always as (quantity * unit_price) stored
);

create table public.order_products (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.service_orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity numeric(12,2) not null default 1 check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  subtotal numeric(12,2) generated always as (quantity * unit_price) stored
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.service_orders(id),
  payment_method text not null,
  amount numeric(12,2) not null check (amount > 0),
  reference text,
  received_by uuid not null references public.profiles(id),
  paid_at timestamptz not null default now()
);

-- Crear perfil automáticamente después del registro.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email, 'Usuario'));
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.vehicles enable row level security;
alter table public.services enable row level security;
alter table public.products enable row level security;
alter table public.service_orders enable row level security;
alter table public.order_services enable row level security;
alter table public.order_products enable row level security;
alter table public.payments enable row level security;

-- Políticas iniciales deliberadamente simples para el MVP académico.
create policy "profiles read authenticated" on public.profiles for select to authenticated using (true);
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "customers authenticated all" on public.customers for all to authenticated using (true) with check (true);
create policy "vehicles authenticated all" on public.vehicles for all to authenticated using (true) with check (true);
create policy "services public read" on public.services for select to anon, authenticated using (active = true);
create policy "services authenticated write" on public.services for all to authenticated using (true) with check (true);
create policy "products authenticated all" on public.products for all to authenticated using (true) with check (true);
create policy "orders authenticated all" on public.service_orders for all to authenticated using (true) with check (true);
create policy "order services authenticated all" on public.order_services for all to authenticated using (true) with check (true);
create policy "order products authenticated all" on public.order_products for all to authenticated using (true) with check (true);
create policy "payments authenticated all" on public.payments for all to authenticated using (true) with check (true);

insert into public.services (name, description, price) values
('Cambio de aceite', 'Cambio de aceite y mano de obra', 10.00),
('Lavado express', 'Lavado exterior rápido', 5.00),
('Pulverizado', 'Pulverizado inferior del vehículo', 6.00),
('Servicio completo', 'Cambio de aceite, lavado express y pulverizado', 18.00);
