import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deleteCustomer } from "../actions";

export default async function CustomerDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string; message?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: customer, error } = await supabase
    .from("customers")
    .select("id, identification, full_name, phone, email, address, created_at, vehicles(id, plate, brand, model, year, current_mileage)")
    .eq("id", params.id)
    .single();

  if (error || !customer) notFound();

  const remove = deleteCustomer.bind(null, customer.id);
  const vehicles = Array.isArray(customer.vehicles) ? customer.vehicles : [];

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/dashboard/clientes" className="text-sm text-slate-600 hover:underline">← Volver a clientes</Link>
          <h1 className="mt-2 text-3xl font-bold">{customer.full_name}</h1>
          <p className="mt-1 font-mono text-sm text-slate-500">{customer.identification || "Sin identificación"}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/clientes/${customer.id}/editar`} className="rounded-lg border bg-white px-4 py-2 font-medium">Editar</Link>
          <form action={remove}>
            <button className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 font-medium text-red-700">Eliminar</button>
          </form>
        </div>
      </div>

      {searchParams.message && <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{searchParams.message}</div>}
      {searchParams.error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{searchParams.error}</div>}

      <div className="grid gap-6 lg:grid-cols-3">
        <article className="rounded-xl border bg-white p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold">Datos del cliente</h2>
          <dl className="mt-5 grid gap-5 sm:grid-cols-2">
            <Detail label="Teléfono" value={customer.phone} />
            <Detail label="Correo" value={customer.email} />
            <div className="sm:col-span-2"><Detail label="Dirección" value={customer.address} /></div>
            <Detail label="Registrado" value={new Date(customer.created_at).toLocaleString("es-EC")} />
          </dl>
        </article>
        <article className="rounded-xl border bg-slate-900 p-6 text-white">
          <p className="text-sm text-slate-300">Vehículos registrados</p>
          <p className="mt-2 text-4xl font-bold">{vehicles.length}</p>
          <p className="mt-4 text-sm text-slate-300">Cada vehículo queda relacionado con este cliente mediante customer_id.</p>
        </article>
      </div>

      <article className="rounded-xl border bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Vehículos</h2>
            <span className="text-sm text-slate-500">Relación 1 cliente → N vehículos</span>
          </div>
          <div className="flex gap-2"><Link href={`/dashboard/ordenes/nueva?customer_id=${customer.id}`} className="rounded-lg border bg-white px-3 py-2 text-sm font-medium">+ Nueva orden</Link><Link href={`/dashboard/vehiculos/nuevo?customer_id=${customer.id}`} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white">+ Registrar vehículo</Link></div>
        </div>
        {vehicles.length === 0 ? (
          <p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">Este cliente todavía no tiene vehículos registrados.</p>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {vehicles.map((vehicle) => (
              <Link href={`/dashboard/vehiculos/${vehicle.id}`} key={vehicle.id} className="rounded-lg border p-4 transition hover:bg-slate-50">
                <p className="font-semibold">{vehicle.plate} · {vehicle.brand} {vehicle.model}</p>
                <p className="mt-1 text-sm text-slate-500">{vehicle.year ?? "Año N/D"} · {vehicle.current_mileage ?? 0} km</p>
              </Link>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-slate-900">{value || "—"}</dd>
    </div>
  );
}
