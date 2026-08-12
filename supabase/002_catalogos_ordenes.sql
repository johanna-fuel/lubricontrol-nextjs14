-- Etapa 3: catálogos + órdenes de servicio
-- Ejecutar SOLO si ya aplicaste schema.sql. Es idempotente y agrega índices útiles.

create index if not exists idx_vehicles_customer_id on public.vehicles(customer_id);
create index if not exists idx_service_orders_customer_id on public.service_orders(customer_id);
create index if not exists idx_service_orders_vehicle_id on public.service_orders(vehicle_id);
create index if not exists idx_service_orders_status on public.service_orders(status);
create index if not exists idx_service_orders_assigned_employee_id on public.service_orders(assigned_employee_id);
create index if not exists idx_order_services_order_id on public.order_services(order_id);
create index if not exists idx_order_products_order_id on public.order_products(order_id);
create index if not exists idx_payments_order_id on public.payments(order_id);

-- Productos de demostración. No duplica si ya existe un producto con el mismo nombre y marca.
insert into public.products (category, brand, name, viscosity, presentation, sale_price, stock, active)
select * from (values
  ('Aceite','Mobil','Super 2000','10W-40','1 litro',8.50,24.00,true),
  ('Aceite','Shell','Helix HX7','10W-40','1 litro',9.25,18.00,true),
  ('Filtro de aceite','Bosch','Filtro de aceite',null,'Unidad',7.00,15.00,true),
  ('Filtro de aire','Mann','Filtro de aire',null,'Unidad',11.50,10.00,true),
  ('Aditivo','Liqui Moly','Engine Flush',null,'300 ml',12.00,8.00,true)
) as seed(category, brand, name, viscosity, presentation, sale_price, stock, active)
where not exists (
  select 1 from public.products p where p.name = seed.name and coalesce(p.brand,'') = coalesce(seed.brand,'')
);
