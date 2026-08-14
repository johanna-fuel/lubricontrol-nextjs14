import Link from "next/link";
import { logout } from "@/app/auth/actions";
import { requireActiveProfile, canManageCatalogs, canOperateReception } from "@/lib/auth/permissions";

const roleLabels = {
  admin: "Administrador",
  receptionist: "Recepción",
  technician: "Técnico",
} as const;

export default async function DashboardPage({ searchParams }: { searchParams: { error?: string } }) {
  const { supabase, user, profile } = await requireActiveProfile();
  const role = profile.role;

  const [{ count: customerCount }, { count: vehicleCount }, { count: orderCount }, { count: pendingCount }, { count: productCount }] = await Promise.all([
    supabase.from("customers").select("id", { count: "exact", head: true }),
    supabase.from("vehicles").select("id", { count: "exact", head: true }),
    supabase.from("service_orders").select("id", { count: "exact", head: true }),
    supabase.from("service_orders").select("id", { count: "exact", head: true }).in("status", ["pending", "assigned", "in_progress"]),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("active", true),
  ]);

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="mt-2 text-slate-600">{profile.full_name} · {roleLabels[role]} · {user.email}</p>
        </div>
        <form action={logout}><button className="rounded border px-4 py-2">Cerrar sesión</button></form>
      </div>

      {searchParams.error && <div className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-800">{searchParams.error}</div>}

      <div className="mt-8 grid gap-4 md:grid-cols-5">
        <Card label="Clientes visibles" value={customerCount} />
        <Card label="Vehículos visibles" value={vehicleCount} />
        <Card label={role === "technician" ? "Mis órdenes" : "Órdenes"} value={orderCount} />
        <Card label="En atención" value={pendingCount} />
        <Card label="Productos activos" value={productCount} />
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        {canOperateReception(role) && <Link href="/dashboard/ordenes/nueva" className="inline-flex rounded-lg bg-slate-900 px-4 py-2.5 font-medium text-white">+ Nueva orden</Link>}
        <Link href="/dashboard/ordenes" className="inline-flex rounded-lg border bg-white px-4 py-2.5 font-medium">{role === "technician" ? "Mis órdenes" : "Órdenes"}</Link>
        {canOperateReception(role) && <Link href="/dashboard/clientes" className="inline-flex rounded-lg border bg-white px-4 py-2.5 font-medium">Clientes</Link>}
        {canOperateReception(role) && <Link href="/dashboard/vehiculos" className="inline-flex rounded-lg border bg-white px-4 py-2.5 font-medium">Vehículos</Link>}
        {canManageCatalogs(role) && <Link href="/dashboard/servicios" className="inline-flex rounded-lg border bg-white px-4 py-2.5 font-medium">Servicios</Link>}
        {canManageCatalogs(role) && <Link href="/dashboard/productos" className="inline-flex rounded-lg border bg-white px-4 py-2.5 font-medium">Productos</Link>}
        {role === "admin" && <Link href="/dashboard/usuarios" className="inline-flex rounded-lg border bg-white px-4 py-2.5 font-medium">Usuarios y roles</Link>}
        <Link href="/consulta-vehiculo" className="inline-flex rounded-lg border bg-white px-4 py-2.5 font-medium">Consulta vehicular SRI</Link>
      </div>
    </section>
  );
}

function Card({ label, value }: { label: string; value: number | null }) {
  return <article className="rounded-xl border bg-white p-5"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold">{value ?? 0}</p></article>;
}
