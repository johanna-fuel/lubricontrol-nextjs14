import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateOrder } from "../../actions";

export default async function EditOrderPage({
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

  const [{ data: order }, { data: profiles }] = await Promise.all([
    supabase
      .from("service_orders")
      .select("id, order_number, status, mileage, observations, assigned_employee_id, inventory_applied")
      .eq("id", params.id)
      .single(),
    supabase.from("profiles").select("id, full_name, role").eq("active", true).order("full_name"),
  ]);

  if (!order) notFound();
  if (order.inventory_applied || ["completed", "delivered"].includes(order.status)) {
    redirect(`/dashboard/ordenes/${order.id}?error=${encodeURIComponent("Una orden finalizada o entregada ya no admite edición operativa.")}`);
  }

  const save = updateOrder.bind(null, order.id);

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href={`/dashboard/ordenes/${order.id}`} className="text-sm text-slate-600 hover:underline">← Volver a la orden</Link>
        <h1 className="mt-2 text-3xl font-bold">Editar OS-{String(order.order_number).padStart(5, "0")}</h1>
        <p className="mt-1 text-slate-600">Los estados Finalizada y Entregada se controlan desde el flujo de cierre, inventario y cobro.</p>
      </div>
      {searchParams.error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{searchParams.error}</div>}
      <form action={save} className="space-y-5 rounded-xl border bg-white p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium">Estado</span>
            <select name="status" defaultValue={order.status} className="w-full rounded-lg border px-3 py-2">
              <option value="pending">Pendiente</option>
              <option value="assigned">Asignada</option>
              <option value="in_progress">En proceso</option>
              <option value="cancelled">Cancelada</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Técnico asignado</span>
            <select name="assigned_employee_id" defaultValue={order.assigned_employee_id ?? ""} className="w-full rounded-lg border px-3 py-2">
              <option value="">Sin asignar</option>
              {(profiles ?? []).map((profile) => <option key={profile.id} value={profile.id}>{profile.full_name} · {profile.role}</option>)}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Kilometraje</span>
            <input name="mileage" type="number" min={0} step={1} defaultValue={order.mileage ?? ""} className="w-full rounded-lg border px-3 py-2" />
          </label>
        </div>
        <label className="block space-y-2">
          <span className="text-sm font-medium">Observaciones</span>
          <textarea name="observations" rows={5} defaultValue={order.observations ?? ""} className="w-full rounded-lg border px-3 py-2" />
        </label>
        <div className="flex justify-end"><button className="rounded-lg bg-slate-900 px-5 py-2.5 font-medium text-white">Guardar cambios</button></div>
      </form>
    </section>
  );
}
