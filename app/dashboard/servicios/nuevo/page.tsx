import Link from "next/link";
import { ServiceForm } from "@/components/service-form";
import { createService } from "../actions";

export default function NewServicePage({ searchParams }: { searchParams: { error?: string } }) {
  return <section className="mx-auto max-w-3xl space-y-6">
    <div><Link href="/dashboard/servicios" className="text-sm text-slate-600 hover:underline">← Volver a servicios</Link><h1 className="mt-2 text-3xl font-bold">Nuevo servicio</h1></div>
    {searchParams.error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{searchParams.error}</div>}
    <ServiceForm action={createService} submitLabel="Guardar servicio" />
  </section>;
}
