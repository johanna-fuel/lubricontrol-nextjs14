import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VehicleForm } from "@/components/vehicle-form";
import { createVehicle } from "../actions";

export default async function NewVehiclePage({
  searchParams,
}: {
  searchParams: { customer_id?: string; error?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: customers, error } = await supabase
    .from("customers")
    .select("id, identification, full_name")
    .order("full_name");

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/dashboard/vehiculos" className="text-sm text-slate-600 hover:underline">← Volver a vehículos</Link>
        <h1 className="mt-2 text-3xl font-bold">Nuevo vehículo</h1>
        <p className="mt-1 text-slate-600">Registra un vehículo y relaciónalo con su propietario.</p>
      </div>

      {searchParams.error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{searchParams.error}</div>}
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">No se pudieron cargar los clientes: {error.message}</div>}
      {!error && (customers ?? []).length === 0 ? (
        <div className="rounded-xl border bg-white p-6">
          <p className="font-medium">Primero necesitas registrar un cliente.</p>
          <Link href="/dashboard/clientes/nuevo" className="mt-3 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-white">Crear cliente</Link>
        </div>
      ) : (
        <VehicleForm
          action={createVehicle}
          customers={customers ?? []}
          defaultCustomerId={searchParams.customer_id}
          submitLabel="Guardar vehículo"
        />
      )}
    </section>
  );
}
