import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VehicleSearch } from "@/components/vehicle-search";

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: { error?: string; message?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data, error } = await supabase
    .from("vehicles")
    .select("id, plate, brand, model, year, current_mileage, customers(id, full_name, identification)")
    .order("plate", { ascending: true });

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Vehículos</h1>
          <p className="mt-1 text-slate-600">Vehículos asociados a los clientes de la lubricadora.</p>
        </div>
        <Link href="/dashboard/vehiculos/nuevo" className="rounded-lg bg-slate-900 px-4 py-2.5 font-medium text-white">
          + Nuevo vehículo
        </Link>
      </div>

      {searchParams.message && <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{searchParams.message}</div>}
      {searchParams.error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{searchParams.error}</div>}
      {error ? (
        <div className="rounded-lg bg-red-50 p-4 text-red-800">No se pudieron cargar los vehículos: {error.message}</div>
      ) : (
        <VehicleSearch vehicles={(data ?? []) as never[]} />
      )}
    </section>
  );
}
