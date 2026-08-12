# LubriControl

Aplicación académica full-stack para administrar clientes, vehículos, catálogos de productos/servicios y órdenes de servicio de una lubricadora.

## Stack
- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- Supabase PostgreSQL + Auth + RLS
- Vercel

## Inicio local
1. `npm install`
2. Copiar `.env.example` como `.env.local`
3. Configurar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Ejecutar `supabase/schema.sql` en un proyecto nuevo de Supabase
5. Si ya tenías el esquema inicial, ejecutar `supabase/002_catalogos_ordenes.sql`
6. `npm run dev`

## Funcionalidades implementadas
- Auth con correo y contraseña
- CRUD de clientes
- CRUD de vehículos y relación cliente → vehículos
- CRUD de catálogo de servicios
- CRUD de catálogo de productos
- Órdenes de servicio con cliente, vehículo, técnico, servicios y productos
- Cálculo de total en cliente y validación/recalculo en servidor
- Estados de orden: pendiente, asignada, en proceso, finalizada, entregada y cancelada
- Búsqueda/filtros con `useState`
- Dashboard con conteos reales
- RLS inicial para usuarios autenticados

## Flujo principal
Cliente → Vehículo → Orden → Servicios/Productos → Técnico → Estado → Cobro (siguiente etapa)

## Roles
- `admin`: configuración y acceso general
- `receptionist`: clientes, vehículos, órdenes y cobros
- `technician`: órdenes asignadas y actualización de estados

## Seguridad
Nunca subir `.env.local` a GitHub. Las políticas RLS actuales son deliberadamente amplias para el MVP académico y deben endurecerse por rol antes del cierre del proyecto.
