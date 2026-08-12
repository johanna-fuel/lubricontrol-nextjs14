import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CustomerForm } from "@/components/customer-form";
import { createClient } from "@/lib/supabase/server";
import { updateCustomer } from "../../actions";

export default async function EditCustomerPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: customer, error } = await supabase
    .from("customers")
    .select("id, identification, full_name, phone, email, address")
    .eq("id", params.id)
    .single();

  if (error || !customer) notFound();

  const action = updateCustomer.bind(null, customer.id);

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href={`/dashboard/clientes/${customer.id}`} className="text-sm text-slate-600 hover:underline">← Volver al cliente</Link>
        <h1 className="mt-2 text-3xl font-bold">Editar cliente</h1>
        <p className="mt-1 text-slate-600">Actualiza la información de {customer.full_name}.</p>
      </div>
      {searchParams.error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{searchParams.error}</div>}
      <CustomerForm action={action} customer={customer} submitLabel="Guardar cambios" />
    </section>
  );
}
