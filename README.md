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
