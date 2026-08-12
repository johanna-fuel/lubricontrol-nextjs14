import Link from "next/link";
import { CustomerForm } from "@/components/customer-form";
import { createCustomer } from "../actions";

export default function NewCustomerPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/dashboard/clientes" className="text-sm text-slate-600 hover:underline">← Volver a clientes</Link>
        <h1 className="mt-2 text-3xl font-bold">Nuevo cliente</h1>
        <p className="mt-1 text-slate-600">Registra los datos básicos para luego asociar uno o más vehículos.</p>
      </div>

      {searchParams.error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{searchParams.error}</div>}
      <CustomerForm action={createCustomer} submitLabel="Guardar cliente" />
    </section>
  );
}
