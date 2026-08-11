import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

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
        {['Órdenes pendientes', 'Vehículos atendidos', 'Ventas del día'].map((title) => (
          <article key={title} className="rounded-xl border bg-white p-6"><p className="text-sm text-slate-500">{title}</p><p className="mt-2 text-3xl font-bold">0</p></article>
        ))}
      </div>
    </section>
  );
}
