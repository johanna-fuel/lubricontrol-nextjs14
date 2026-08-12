import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [{ count: customerCount }, { count: vehicleCount }] = await Promise.all([
    supabase.from("customers").select("id", { count: "exact", head: true }),
    supabase.from("vehicles").select("id", { count: "exact", head: true }),
  ]);

  return (
    <section>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="mt-2 text-slate-600">Sesión activa: {user.email}</p>
        </div>
        <form action={logout}><button className="rounded border px-4 py-2">Cerrar sesión</button></form>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <article className="rounded-xl border bg-white p-6"><p className="text-sm text-slate-500">Clientes registrados</p><p className="mt-2 text-3xl font-bold">{customerCount ?? 0}</p></article>
        <article className="rounded-xl border bg-white p-6"><p className="text-sm text-slate-500">Vehículos registrados</p><p className="mt-2 text-3xl font-bold">{vehicleCount ?? 0}</p></article>
        <article className="rounded-xl border bg-white p-6"><p className="text-sm text-slate-500">Órdenes pendientes</p><p className="mt-2 text-3xl font-bold">0</p></article>
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/dashboard/clientes" className="inline-flex rounded-lg bg-slate-900 px-4 py-2.5 font-medium text-white">Gestionar clientes</Link>
        <Link href="/dashboard/vehiculos" className="inline-flex rounded-lg border bg-white px-4 py-2.5 font-medium">Gestionar vehículos</Link>
      </div>
    </section>
  );
}
