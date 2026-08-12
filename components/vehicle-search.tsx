"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type VehicleRow = {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number | null;
  current_mileage: number | null;
  customers: { id: string; full_name: string; identification: string } | null;
};

export function VehicleSearch({ vehicles }: { vehicles: VehicleRow[] }) {
  const [search, setSearch] = useState("");
  const query = search.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!query) return vehicles;
    return vehicles.filter((vehicle) => {
      const customer = vehicle.customers;
      return [
        vehicle.plate,
        vehicle.brand,
        vehicle.model,
        customer?.full_name,
        customer?.identification,
      ].some((value) => value?.toLowerCase().includes(query));
    });
  }, [query, vehicles]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-white p-4">
        <label className="text-sm font-medium text-slate-700">Buscar vehículo</label>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Placa, marca, modelo, cliente o identificación..."
          className="mt-2 w-full rounded-lg border px-3 py-2"
        />
        <p className="mt-2 text-sm text-slate-500">{filtered.length} de {vehicles.length} vehículo(s)</p>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border bg-white p-8 text-center text-slate-500">No se encontraron vehículos.</div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Placa</th>
                  <th className="px-4 py-3">Vehículo</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Año</th>
                  <th className="px-4 py-3">Kilometraje</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {filtered.map((vehicle) => (
                  <tr key={vehicle.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold">{vehicle.plate}</td>
                    <td className="px-4 py-3">{vehicle.brand} {vehicle.model}</td>
                    <td className="px-4 py-3">
                      {vehicle.customers ? (
                        <Link href={`/dashboard/clientes/${vehicle.customers.id}`} className="hover:underline">
                          {vehicle.customers.full_name}
                        </Link>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3">{vehicle.year ?? "—"}</td>
                    <td className="px-4 py-3">{vehicle.current_mileage !== null ? `${vehicle.current_mileage.toLocaleString("es-EC")} km` : "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/dashboard/vehiculos/${vehicle.id}`} className="font-medium text-slate-700 hover:underline">Abrir</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
