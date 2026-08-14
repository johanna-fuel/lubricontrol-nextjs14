import Link from "next/link";
import { requireRoles, type UserRole } from "@/lib/auth/permissions";
import { updateUserRole } from "./actions";

const roleLabel: Record<UserRole, string> = {
  admin: "Administrador",
  receptionist: "Recepción",
  technician: "Técnico",
};

export default async function UsersPage({
  searchParams,
}: {
  searchParams: { error?: string; message?: string };
}) {
  const { supabase, user } = await requireRoles(["admin"]);
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, phone, active, created_at")
    .order("created_at", { ascending: true });

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Usuarios y roles</h1>
          <p className="mt-2 text-slate-600">
            Define permisos reales y crea cuentas administrativas sin exponer la clave privilegiada de Supabase al navegador.
          </p>
        </div>
        <Link
          href="/dashboard/usuarios/nuevo"
          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-800"
        >
          + Nuevo usuario
        </Link>
      </div>

      {searchParams.message && <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{searchParams.message}</div>}
      {searchParams.error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{searchParams.error}</div>}
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error.message}</div>}

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Usuario</th>
              <th className="px-4 py-3">Rol actual</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Cambiar permisos</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(profiles ?? []).map((profile) => {
              const role = profile.role as UserRole;
              const isSelf = profile.id === user.id;
              return (
                <tr key={profile.id}>
                  <td className="px-4 py-4">
                    <p className="font-medium">{profile.full_name}</p>
                    <p className="text-xs text-slate-500">{isSelf ? "Tu usuario" : profile.id}</p>
                  </td>
                  <td className="px-4 py-4">{roleLabel[role]}</td>
                  <td className="px-4 py-4">{profile.active ? "Activo" : "Inactivo"}</td>
                  <td className="px-4 py-4">
                    <form action={updateUserRole} className="flex flex-wrap items-center gap-2">
                      <input type="hidden" name="profile_id" value={profile.id} />
                      <select name="role" defaultValue={role} className="rounded-lg border px-3 py-2" disabled={isSelf}>
                        <option value="admin">Administrador</option>
                        <option value="receptionist">Recepción</option>
                        <option value="technician">Técnico</option>
                      </select>
                      <select name="active" defaultValue={String(profile.active)} className="rounded-lg border px-3 py-2" disabled={isSelf}>
                        <option value="true">Activo</option>
                        <option value="false">Inactivo</option>
                      </select>
                      {isSelf ? (
                        <span className="text-xs text-slate-500">Protegido</span>
                      ) : (
                        <button className="rounded-lg bg-slate-900 px-3 py-2 font-medium text-white">Guardar</button>
                      )}
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
