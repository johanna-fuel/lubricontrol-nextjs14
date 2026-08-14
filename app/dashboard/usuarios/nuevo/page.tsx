import Link from "next/link";
import { requireRoles } from "@/lib/auth/permissions";
import { createUser } from "../actions";

export default async function NewUserPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  await requireRoles(["admin"]);

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/dashboard/usuarios" className="text-sm text-slate-600 hover:text-slate-900">
          ← Volver a usuarios
        </Link>
        <h1 className="mt-3 text-3xl font-bold">Nuevo usuario</h1>
        <p className="mt-2 text-slate-600">
          Crea una cuenta de Supabase Auth y su perfil operativo en LubriControl. La contraseña es temporal y debe entregarse al usuario por un canal seguro.
        </p>
      </div>

      {searchParams.error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{searchParams.error}</div>
      )}

      <form action={createUser} className="space-y-5 rounded-xl border bg-white p-6 shadow-sm">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium">Nombre completo *</span>
            <input
              name="full_name"
              required
              autoComplete="name"
              className="w-full rounded-lg border px-3 py-2"
              placeholder="Ej. Pedro Técnico"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Correo electrónico *</span>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              className="w-full rounded-lg border px-3 py-2"
              placeholder="tecnico@lubricontrol.demo"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Teléfono</span>
            <input
              name="phone"
              autoComplete="tel"
              className="w-full rounded-lg border px-3 py-2"
              placeholder="0999999999"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Rol *</span>
            <select name="role" defaultValue="technician" className="w-full rounded-lg border px-3 py-2">
              <option value="technician">Técnico</option>
              <option value="receptionist">Recepción</option>
              <option value="admin">Administrador</option>
            </select>
          </label>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium">Contraseña temporal *</span>
            <input
              type="password"
              name="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full rounded-lg border px-3 py-2"
              placeholder="Mínimo 8 caracteres"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Confirmar contraseña *</span>
            <input
              type="password"
              name="password_confirm"
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full rounded-lg border px-3 py-2"
              placeholder="Repite la contraseña"
            />
          </label>
        </div>

        <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
          La cuenta se crea con el correo confirmado administrativamente para que pueda iniciar sesión de inmediato. La clave privilegiada de Supabase permanece únicamente en el servidor.
        </div>

        <div className="flex flex-wrap gap-3">
          <button className="rounded-lg bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-800">
            Crear usuario
          </button>
          <Link href="/dashboard/usuarios" className="rounded-lg border px-4 py-2 font-medium hover:bg-slate-50">
            Cancelar
          </Link>
        </div>
      </form>
    </section>
  );
}
