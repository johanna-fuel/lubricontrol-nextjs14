# LubriControl

Aplicación académica full-stack para administrar clientes, vehículos, órdenes de servicio, productos, técnicos y cobros de una lubricadora.

## Stack
- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- Supabase PostgreSQL + Auth + RLS
- Vercel

## Inicio local
1. `npm install`
2. Copiar `.env.example` como `.env.local`
3. Crear proyecto en Supabase y pegar URL y clave pública
4. Ejecutar `supabase/schema.sql` en el SQL Editor de Supabase
5. `npm run dev`

## Roles
- `admin`: configuración y acceso general
- `receptionist`: clientes, vehículos, órdenes y cobros
- `technician`: órdenes asignadas y actualización de estados

## Alcance MVP
- Auth con correo y contraseña
- Dos o más roles
- Rutas públicas y privadas
- Clientes y vehículos
- Catálogo de productos y servicios
- Órdenes de servicio con detalle
- Asignación de técnico
- Cobro interno
- API externa vehicular
- Deploy en Vercel

## Seguridad
Nunca subir `.env.local` a GitHub. Las políticas RLS de `schema.sql` son iniciales y se endurecerán por rol en una etapa posterior.

## CRUD de clientes

Rutas privadas añadidas:

- `/dashboard/clientes`: listado y búsqueda con `useState`.
- `/dashboard/clientes/nuevo`: alta mediante Server Action.
- `/dashboard/clientes/[id]`: detalle dinámico y lectura de vehículos relacionados.
- `/dashboard/clientes/[id]/editar`: actualización mediante Server Action.
- Eliminación mediante Server Action desde el detalle.

El CRUD usa la tabla `public.customers` ya definida en `supabase/schema.sql` y las políticas RLS iniciales para usuarios autenticados.

## Avance 2 — CRUD de vehículos

- Listado privado de vehículos con búsqueda por placa, marca, modelo, cliente o identificación.
- Alta de vehículo asociándolo obligatoriamente a un cliente.
- Detalle dinámico `/dashboard/vehiculos/[id]`.
- Edición y eliminación mediante Server Actions.
- Acceso para registrar un vehículo directamente desde el detalle del cliente.
- Relación `customers (1) -> (N) vehicles` utilizando `vehicles.customer_id`.
- Validaciones de placa única, año y kilometraje.
