import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VehicleForm } from "@/components/vehicle-form";
import { updateVehicle } from "../../actions";

export default async function EditVehiclePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [{ data: vehicle, error: vehicleError }, { data: customers, error: customerError }] = await Promise.all([
    supabase.from("vehicles").select("id, customer_id, plate, vin, brand, model, year, color, current_mileage").eq("id", params.id).single(),
    supabase.from("customers").select("id, identification, full_name").order("full_name"),
  ]);

  if (vehicleError || !vehicle) notFound();
  const save = updateVehicle.bind(null, vehicle.id);

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href={`/dashboard/vehiculos/${vehicle.id}`} className="text-sm text-slate-600 hover:underline">← Volver al vehículo</Link>
        <h1 className="mt-2 text-3xl font-bold">Editar {vehicle.plate}</h1>
      </div>

      {searchParams.error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{searchParams.error}</div>}
      {customerError ? (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">No se pudieron cargar los clientes: {customerError.message}</div>
      ) : (
        <VehicleForm action={save} vehicle={vehicle} customers={customers ?? []} submitLabel="Guardar cambios" />
      )}
    </section>
  );
}
