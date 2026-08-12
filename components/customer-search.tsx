"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type CustomerListItem = {
  id: string;
  identification: string | null;
  full_name: string;
  phone: string | null;
  email: string | null;
  created_at: string;
};

export function CustomerSearch({ customers }: { customers: CustomerListItem[] }) {
  const [search, setSearch] = useState("");

  const filteredCustomers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return customers;

    return customers.filter((customer) =>
      [customer.full_name, customer.identification, customer.phone, customer.email]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [customers, search]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-white p-4">
        <label htmlFor="customer-search" className="mb-2 block text-sm font-medium text-slate-700">
          Buscar cliente
        </label>
        <input
          id="customer-search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Nombre, cédula/RUC, teléfono o correo..."
          className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-slate-300"
        />
        <p className="mt-2 text-xs text-slate-500">
          {filteredCustomers.length} de {customers.length} cliente(s)
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Identificación</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Teléfono</th>
                <th className="px-4 py-3">Correo</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs">{customer.identification || "—"}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{customer.full_name}</td>
                  <td className="px-4 py-3 text-slate-600">{customer.phone || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{customer.email || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <Link className="font-medium text-slate-900 underline-offset-4 hover:underline" href={`/dashboard/clientes/${customer.id}`}>
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                    No hay clientes que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
