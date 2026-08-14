# LubriControl

Aplicación web académica full-stack para gestionar el flujo operativo básico de una lubricadora: clientes, vehículos, servicios, productos, órdenes de trabajo, consumo de inventario, cobros y comprobante interno.

> Proyecto Integrador — Aplicaciones Web. Stack obligatorio: Next.js 14, TypeScript, Tailwind CSS, Supabase (PostgreSQL + Auth + RLS) y despliegue en Vercel.

## Demo en vivo

- Producción: `PENDIENTE_URL_VERCEL`
- Video de sustentación: `PENDIENTE_URL_VIDEO`

## Capturas de pantalla

Agregar antes de la entrega al menos 3 capturas en `docs/screenshots/`:

1. Dashboard y roles.
2. Orden de servicio con productos/servicios.
3. Cobro/comprobante interno.

## Stack tecnológico

- Next.js 14.2.35 — App Router
- React 18
- TypeScript
- Tailwind CSS
- Supabase PostgreSQL
- Supabase Auth con cookies SSR (`@supabase/ssr`)
- Row Level Security (RLS)
- consulta vehicular externa mediante servicios usados por SRI en Línea (Ecuador)
- Git + GitHub
- Vercel

## Roles de usuario

### Administrador (`admin`)

- Acceso completo al dashboard.
- CRUD de clientes y vehículos.
- CRUD de servicios y productos.
- Gestión de órdenes y cobros.
- Gestión de roles y estado de usuarios.
- Consulta de todas las órdenes.

### Recepción (`receptionist`)

- CRUD de clientes y vehículos.
- Crear y gestionar órdenes.
- Asignar técnicos.
- Registrar cobros y entregar órdenes.
- Lectura de catálogos.
- No puede administrar productos/servicios ni roles.

### Técnico (`technician`)

- Ve únicamente las órdenes que le fueron asignadas.
- Puede iniciar una orden asignada.
- Puede finalizarla y aplicar el consumo de inventario mediante función PostgreSQL protegida.
- No puede crear clientes, vehículos, órdenes, cobros ni modificar catálogos.

Los usuarios nuevos se registran inicialmente como `technician`. El primer usuario existente se promueve a `admin` al ejecutar la migración final si todavía no existe un administrador.

## Modelo de datos

```text
auth.users
    │ 1:1
    ▼
profiles

customers
    │ 1:N
    ▼
vehicles
    │
    └──────────────┐
                   ▼
             service_orders
              /    |      \
             /     |       \
    order_services |   order_products
          │         │         │
          ▼         │         ▼
       services     │      products
                    │
                    ▼
                 payments
```

Tablas principales:

- `profiles`
- `customers`
- `vehicles`
- `services`
- `products`
- `service_orders`
- `order_services`
- `order_products`
- `payments`

## Flujo funcional

```text
Cliente
  ↓
Vehículo
  ↓
Orden
  ↓
Asignación de técnico
  ↓
En proceso
  ↓
Finalización
  ↓
Descuento de productos
  ↓
Cobro
  ↓
Comprobante interno
  ↓
Entregada
```

El consumo de inventario se ejecuta en PostgreSQL de forma transaccional e idempotente para impedir descuentos duplicados.

> El comprobante generado por LubriControl es interno y no constituye factura ni comprobante tributario electrónico.

## Rutas públicas

- `/` — Inicio.
- `/servicios` — Catálogo público de servicios.
- `/consulta-vehiculo` — Consulta vehicular externa por placa, RAMV o CPN mediante servicios usados por SRI en Línea (Ecuador).
- `/auth/login` — Inicio de sesión.
- `/auth/register` — Registro.

## Rutas privadas principales

- `/dashboard`
- `/dashboard/clientes`
- `/dashboard/vehiculos`
- `/dashboard/servicios`
- `/dashboard/productos`
- `/dashboard/ordenes`
- `/dashboard/usuarios`

Ruta dinámica principal:

- `/dashboard/ordenes/[id]`

## API REST externa

La ruta `/consulta-vehiculo` consume, con `fetch` y `async/await` desde un Server Component, un endpoint JSON utilizado por SRI en Línea para consultar información vehicular por placa, RAMV o CPN. Es una fuente externa independiente de Supabase. Se documenta como un servicio utilizado por el portal del SRI, no como una API pública formalmente documentada ni con garantía de estabilidad.

La interfaz incluye:

- consulta dinámica por placa, RAMV o CPN;
- campo abierto: la consulta no está limitada a una placa específica;
- datos de referencia como placa, marca, modelo, año, país, RAMV/CPN, último año pagado y estado de exoneración cuando el SRI los devuelve;
- renderizado del resultado;
- manejo de respuestas HTTP no exitosas;
- timeout;
- manejo de fallos de conexión.

El servicio externo es independiente de Supabase y se utiliza únicamente como consulta informativa. Si el SRI no devuelve datos o el servicio está temporalmente indisponible, LubriControl mantiene el registro manual del vehículo como alternativa.

## Server Components, Client Components y Server Actions

Ejemplos útiles para la sustentación:

- **Server Component:** `/consulta-vehiculo/page.tsx` o listados que consultan Supabase directamente.
- **Client Component:** `components/order-form.tsx`, `customer-search.tsx` o `vehicle-search.tsx`, que utilizan `useState`.
- **Server Action:** acciones CRUD y de órdenes en `app/dashboard/**/actions.ts`.

## Seguridad

- Supabase Auth identifica al usuario.
- El rol se almacena en `public.profiles`, no está hardcodeado como identidad del usuario.
- Las rutas privadas usan sesión SSR.
- Las Server Actions sensibles vuelven a verificar permisos.
- RLS aplica permisos en PostgreSQL incluso si alguien intenta llamar directamente la API de Supabase.
- El técnico solamente puede leer sus órdenes asignadas.
- Catálogos y administración de usuarios están restringidos a `admin`.
- Cobros y entrega están restringidos a `admin`/`receptionist`.
- `.env.local` está excluido de Git.

## Instalación local

```bash
git clone https://github.com/johanna-fuel/lubricontrol-nextjs14.git
cd lubricontrol-nextjs14
npm install
cp .env.example .env.local
```

Configurar `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=TU_CLAVE_PUBLICA
```

Ejecutar migraciones en Supabase SQL Editor, en orden:

1. `supabase/schema.sql`
2. `supabase/002_catalogos_ordenes.sql`
3. `supabase/003_cobros_inventario.sql`
4. `supabase/004_roles_rls.sql`

Después:

```bash
npm run dev
```

Abrir `http://localhost:3000`.

## Confirmación de correo con Supabase SSR

Para confirmación de correo compatible con SSR existe `/auth/confirm`.

En Supabase, configurar el template **Confirm signup** para usar un enlace con `token_hash`, por ejemplo:

```text
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
```

Para una demo académica también puede desactivarse temporalmente la confirmación obligatoria de correo desde la configuración del proveedor Email, siempre que el registro/login sigan funcionando correctamente.

## Build de producción

Antes de cada despliegue:

```bash
npm run build
```

Debe terminar sin errores de compilación ni TypeScript.

## Despliegue en Vercel

Ver [DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md).

Resumen:

1. Subir todos los commits a GitHub.
2. Importar el repositorio en Vercel.
3. Configurar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en Vercel.
4. Desplegar `main` como Production.
5. Configurar la URL de producción en Supabase Auth → URL Configuration.
6. Probar registro, login, roles, CRUD, orden, cobro, API externa y comprobante desde la URL pública.

## Credenciales de prueba

Completar antes de entregar. **No usar contraseñas reales personales.**

```text
Administrador
Correo: admin-demo@ejemplo.com
Contraseña: [DEFINIR]

Recepción
Correo: recepcion-demo@ejemplo.com
Contraseña: [DEFINIR]

Técnico
Correo: tecnico-demo@ejemplo.com
Contraseña: [DEFINIR]
```

## Checklist de requisitos académicos

- [x] Next.js 14 App Router.
- [x] TypeScript.
- [x] Tailwind CSS.
- [x] Supabase PostgreSQL.
- [x] Supabase Auth.
- [x] 3+ tablas relacionadas con FK.
- [x] `profiles` relacionado con `auth.users`.
- [x] Relaciones uno-a-muchos.
- [x] RLS por roles.
- [x] 3 roles con permisos diferenciados.
- [x] 2+ rutas públicas.
- [x] 2+ rutas privadas.
- [x] Ruta dinámica `[id]`.
- [x] CRUD completo.
- [x] Server Actions.
- [x] Client Component con `useState`.
- [x] Server Components.
- [x] API REST externa con `fetch` + `async/await`.
- [x] Manejo de errores de API externa.
- [x] Variables de entorno fuera de Git.
- [ ] 15+ commits descriptivos en GitHub.
- [ ] 3+ capturas agregadas al README.
- [ ] URL pública de Vercel.
- [ ] Credenciales demo de cada rol.
- [ ] Video de defensa de mínimo 15 minutos.

## Commits sugeridos para el cierre

```text
feat: agrega roles y politicas RLS por perfil
feat: agrega gestion administrativa de usuarios
feat: integra consulta vehicular externa con SRI Ecuador
fix: protege server actions por rol
security: restringe catalogos cobros y ordenes por RLS
docs: completa README academico
deploy: configura proyecto para Vercel
```

## Autor

Completar nombre del estudiante y perfil de GitHub antes de la entrega.


### Administración segura de usuarios

La ruta `/dashboard/usuarios/nuevo` está disponible solo para `admin`. La Server Action valida primero la sesión/rol y luego utiliza un cliente Supabase privilegiado en servidor para `auth.admin.createUser()`. Requiere:

```env
SUPABASE_SERVICE_ROLE_KEY=...
```

Esta variable **no** lleva `NEXT_PUBLIC_`, no se sube al repositorio y debe configurarse también en Vercel.
