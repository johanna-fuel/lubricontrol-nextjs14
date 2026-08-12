import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ServiceForm } from "@/components/service-form";
import { deleteService, updateService } from "../../actions";

export default async function EditServicePage({ params, searchParams }: { params: { id: string }; searchParams: { error?: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  const { data: service } = await supabase.from("services").select("id, name, description, price, active").eq("id", params.id).single();
  if (!service) notFound();
  const save = updateService.bind(null, service.id);
  const remove = deleteService.bind(null, service.id);
  return <section className="mx-auto max-w-3xl space-y-6">
    <div className="flex items-start justify-between gap-4"><div><Link href="/dashboard/servicios" className="text-sm text-slate-600 hover:underline">← Volver a servicios</Link><h1 className="mt-2 text-3xl font-bold">Editar servicio</h1></div><form action={remove}><button className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 font-medium text-red-700">Eliminar</button></form></div>
    {searchParams.error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{searchParams.error}</div>}
    <ServiceForm action={save} service={service} submitLabel="Guardar cambios" />
  </section>;
}
