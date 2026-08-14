# Despliegue de LubriControl en Vercel

## 1. Validación local

Desde la raíz del proyecto:

```bash
npm run build
```

No continúes si el build falla.

## 2. Confirmar GitHub

```bash
git status
git add .
git commit -m "feat: cierra seguridad roles RLS y API externa"
git push origin main
```

Verifica que GitHub contenga los cambios pero **no** `.env.local`.

## 3. Crear/importar proyecto en Vercel

En Vercel:

1. `Add New` → `Project`.
2. Conecta GitHub si todavía no está conectado.
3. Selecciona `johanna-fuel/lubricontrol-nextjs14`.
4. Framework Preset: **Next.js**.
5. Root Directory: raíz del repositorio.
6. Build Command: dejar el predeterminado (`next build` / `npm run build`).
7. Output Directory: dejar automático para Next.js.

## 4. Variables de entorno

En la configuración del proyecto agrega:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Usa los mismos valores públicos del proyecto Supabase que tienes en `.env.local`.

Marca al menos **Production**. Para probar Preview Deployments, configúralas también para **Preview**.

No subas `.env.local` a GitHub.

## 5. Primer deploy

Pulsa **Deploy**.

Vercel instalará dependencias, ejecutará el build y publicará una URL similar a:

```text
https://lubricontrol-nextjs14-xxxx.vercel.app
```

Si falla:

1. abre el Deployment;
2. entra en `Build Logs`;
3. copia el primer error real;
4. corrígelo localmente;
5. ejecuta `npm run build`;
6. commit + push.

Cada push posterior a `main` generará un nuevo deployment de producción.

## 6. Configurar Supabase Auth para producción

En Supabase:

`Authentication` → `URL Configuration`

Configura:

```text
Site URL:
https://TU-DOMINIO-DE-PRODUCCION.vercel.app
```

Agrega Redirect URLs:

```text
http://localhost:3000/**
https://TU-DOMINIO-DE-PRODUCCION.vercel.app/**
```

Si usarás URLs Preview de Vercel, agrega también un patrón compatible con tus previews según la configuración de tu cuenta/equipo.

## 7. Confirmación por correo en SSR

Si mantienes `Confirm email` activado, ajusta en Supabase:

`Authentication` → `Email Templates` → `Confirm signup`

El enlace debe enviar el `token_hash` a la ruta incluida en LubriControl:

```text
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
```

La ruta `/auth/confirm` verifica el OTP y crea la sesión mediante cookies SSR.

Para una sustentación controlada, otra opción es desactivar temporalmente la confirmación obligatoria de correo y crear previamente las tres cuentas demo.

## 8. Validación funcional en producción

Prueba desde la URL de Vercel, no desde localhost:

### Público

- `/`
- `/servicios`
- `/consulta-vehiculo`
- registro/login

### Administrador

- usuarios y roles;
- clientes;
- vehículos;
- servicios/productos;
- órdenes;
- cobros;
- entrega.

### Recepción

- clientes/vehículos;
- nueva orden;
- asignación de técnico;
- cobros/entrega;
- comprobar que no accede a gestión de roles ni catálogos.

### Técnico

- comprobar que solo ve órdenes asignadas a él;
- iniciar trabajo;
- finalizar y descontar inventario;
- comprobar que no crea clientes, órdenes o pagos.

## 9. Crear usuarios demo

1. Registra tres cuentas distintas.
2. Entra como Administrador.
3. Ve a `/dashboard/usuarios`.
4. Asigna:
   - una cuenta `admin`;
   - una cuenta `receptionist`;
   - una cuenta `technician`.
5. Registra las credenciales demo en el README con contraseñas exclusivas para la demostración.

## 10. Evidencias para la entrega

Captura al menos:

1. Dashboard de administrador.
2. Supabase mostrando tablas/relaciones o RLS.
3. Orden finalizada con productos/servicios.
4. Comprobante/cobro.
5. Consulta vehicular externa SRI.
6. Vercel con deployment exitoso.

El README exige al menos tres; puedes incluir más.

## 11. Video de defensa (15+ min)

Orden sugerido:

1. 2 min — problema y flujo de la lubricadora.
2. 3 min — demo en Vercel con roles.
3. 3 min — tablas, FK y RLS en Supabase.
4. 3 min — Server Component + Client Component + Server Action.
5. 2 min — Auth, middleware y autorización.
6. 2 min — API externa, retos y aprendizajes.

## 12. Checklist antes de entregar

- [ ] `npm run build` exitoso.
- [ ] `main` funcional.
- [ ] 15+ commits reales y descriptivos.
- [ ] `.env.local` no está en GitHub.
- [ ] Vercel responde por HTTPS.
- [ ] Auth funciona en producción.
- [ ] RLS probado con los tres roles.
- [ ] Consulta vehicular SRI funciona con una placa/RAMV/CPN válida y maneja errores o indisponibilidad del servicio externo.
- [ ] README tiene URL, screenshots, credenciales demo y autor.
- [ ] Video dura 15 minutos o más y su enlace funciona.


## Variable privada para administración de usuarios

Agrega también en Vercel → Project → Settings → Environment Variables:

```text
SUPABASE_SERVICE_ROLE_KEY
```

Debe configurarse para **Production** (y Preview solo si necesitas probar creación de usuarios en previews). No uses el prefijo `NEXT_PUBLIC_`. Esta credencial omite RLS y nunca debe aparecer en código cliente, capturas, commits o README con su valor real.

Después de agregar o cambiar variables de entorno en Vercel, realiza un nuevo deployment/redeploy: los deployments anteriores conservan las variables con las que fueron construidos.
