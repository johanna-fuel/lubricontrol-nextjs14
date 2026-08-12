import Link from "next/link";
import { redirect } from "next/navigation";
import { CustomerSearch, type CustomerListItem } from "@/components/customer-search";
import { createClient } from "@/lib/supabase/server";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: { error?: string; message?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data, error } = await supabase
    .from("customers")
    .select("id, identification, full_name, phone, email, created_at")
    .order("full_name", { ascending: true });

  const customers = (data ?? []) as CustomerListItem[];

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-700">Gestión comercial</p>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="mt-1 text-slate-600">Crea, consulta y actualiza los clientes de la lubricadora.</p>
        </div>
        <Link href="/dashboard/clientes/nuevo" className="rounded-lg bg-slate-900 px-4 py-2.5 text-center font-medium text-white">
          + Nuevo cliente
        </Link>
      </div>

      {searchParams.message && <Alert kind="success">{searchParams.message}</Alert>}
      {searchParams.error && <Alert kind="error">{searchParams.error}</Alert>}
      {error && <Alert kind="error">No se pudieron cargar los clientes: {error.message}</Alert>}

      <CustomerSearch customers={customers} />
    </section>
  );
}

function Alert({ kind, children }: { kind: "success" | "error"; children: React.ReactNode }) {
  const classes = kind === "success" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800";
  return <div className={`rounded-lg p-3 text-sm ${classes}`}>{children}</div>;
}
