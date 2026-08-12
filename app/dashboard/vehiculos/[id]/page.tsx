import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deleteVehicle } from "../actions";

export default async function VehicleDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string; message?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: vehicle, error } = await supabase
    .from("vehicles")
    .select("id, customer_id, plate, vin, brand, model, year, color, current_mileage, created_at, customers(id, identification, full_name, phone)")
    .eq("id", params.id)
    .single();

  if (error || !vehicle) notFound();

  const remove = deleteVehicle.bind(null, vehicle.id);
  const customer = Array.isArray(vehicle.customers) ? vehicle.customers[0] : vehicle.customers;

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/dashboard/vehiculos" className="text-sm text-slate-600 hover:underline">← Volver a vehículos</Link>
          <h1 className="mt-2 text-3xl font-bold">{vehicle.plate}</h1>
          <p className="mt-1 text-slate-600">{vehicle.brand} {vehicle.model}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/ordenes/nueva?customer_id=${customer?.id ?? ""}&vehicle_id=${vehicle.id}`} className="rounded-lg bg-slate-900 px-4 py-2 font-medium text-white">+ Nueva orden</Link>
          <Link href={`/dashboard/vehiculos/${vehicle.id}/editar`} className="rounded-lg border bg-white px-4 py-2 font-medium">Editar</Link>
          <form action={remove}>
            <button className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 font-medium text-red-700">Eliminar</button>
          </form>
        </div>
      </div>

      {searchParams.message && <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{searchParams.message}</div>}
      {searchParams.error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{searchParams.error}</div>}

      <div className="grid gap-6 lg:grid-cols-3">
        <article className="rounded-xl border bg-white p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold">Datos del vehículo</h2>
          <dl className="mt-5 grid gap-5 sm:grid-cols-2">
            <Detail label="VIN / Chasis" value={vehicle.vin} />
            <Detail label="Año" value={vehicle.year?.toString()} />
            <Detail label="Color" value={vehicle.color} />
            <Detail label="Kilometraje" value={vehicle.current_mileage !== null ? `${vehicle.current_mileage.toLocaleString("es-EC")} km` : null} />
            <Detail label="Registrado" value={new Date(vehicle.created_at).toLocaleString("es-EC")} />
          </dl>
        </article>

        <article className="rounded-xl border bg-slate-900 p-6 text-white">
          <p className="text-sm text-slate-300">Propietario</p>
          <p className="mt-2 text-xl font-semibold">{customer?.full_name ?? "Sin cliente"}</p>
          <p className="mt-1 text-sm text-slate-300">{customer?.identification ?? ""}</p>
          {customer && (
            <Link href={`/dashboard/clientes/${customer.id}`} className="mt-5 inline-flex rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-900">
              Abrir cliente
            </Link>
          )}
        </article>
      </div>

      <article className="rounded-xl border bg-white p-6">
        <h2 className="text-lg font-semibold">Próxima etapa</h2>
        <p className="mt-2 text-slate-600">Este vehículo podrá seleccionarse al crear una orden de servicio y registrar su kilometraje de ingreso.</p>
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
