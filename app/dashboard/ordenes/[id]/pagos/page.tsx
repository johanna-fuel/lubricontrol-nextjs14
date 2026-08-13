import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deliverOrder } from "../../actions";
import { deletePayment, registerPayment } from "./actions";

const methodLabels: Record<string, string> = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
  other: "Otro",
};

export default async function PaymentsPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string; message?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [{ data: order }, { data: payments }] = await Promise.all([
    supabase
      .from("service_orders")
      .select(
        "id, order_number, status, total, inventory_applied, customers!service_orders_customer_id_fkey(full_name), vehicles!service_orders_vehicle_id_fkey(plate, brand, model)"
      )
      .eq("id", params.id)
      .single(),
    supabase
      .from("payments")
      .select("id, payment_method, amount, reference, paid_at, profiles!payments_received_by_fkey(full_name)")
      .eq("order_id", params.id)
      .order("paid_at", { ascending: true }),
  ]);

  if (!order) notFound();

  const total = Number(order.total);
  const paid = (payments ?? []).reduce((sum, payment) => sum + Number(payment.amount), 0);
  const remaining = Math.max(0, total - paid);
  const canPay = order.status === "completed" && order.inventory_applied && remaining > 0;
  const canDeliver = order.status === "completed" && order.inventory_applied && remaining <= 0.00001;
  const customer: any = order.customers;
  const vehicle: any = order.vehicles;
  const save = registerPayment.bind(null, order.id);
  const deliver = deliverOrder.bind(null, order.id);

  return (
    <section className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href={`/dashboard/ordenes/${order.id}`} className="text-sm text-slate-600 hover:underline">
            ← Volver a la orden
          </Link>
          <h1 className="mt-2 text-3xl font-bold">Cobros OS-{String(order.order_number).padStart(5, "0")}</h1>
          <p className="mt-1 text-slate-600">
            {customer?.full_name} · {vehicle?.plate} · {[vehicle?.brand, vehicle?.model].filter(Boolean).join(" ")}
          </p>
        </div>
        <Link href={`/dashboard/ordenes/${order.id}/comprobante`} className="rounded-lg border bg-white px-4 py-2 font-medium">
          Ver comprobante
        </Link>
      </div>

      {searchParams.message && <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{searchParams.message}</div>}
      {searchParams.error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{searchParams.error}</div>}

      <div className="grid gap-4 sm:grid-cols-3">
        <Summary label="Total orden" value={total} />
        <Summary label="Cobrado" value={paid} />
        <Summary label="Saldo" value={remaining} />
      </div>

      {canPay && (
        <form action={save} className="rounded-xl border bg-white p-6">
          <h2 className="text-lg font-semibold">Registrar cobro</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium">Forma de pago</span>
              <select name="payment_method" defaultValue="cash" className="w-full rounded-lg border px-3 py-2" required>
                <option value="cash">Efectivo</option>
                <option value="card">Tarjeta</option>
                <option value="transfer">Transferencia</option>
                <option value="other">Otro</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Valor</span>
              <input
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                max={remaining.toFixed(2)}
                defaultValue={remaining.toFixed(2)}
                className="w-full rounded-lg border px-3 py-2"
                required
              />
            </label>
            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium">Referencia / autorización (opcional)</span>
              <input name="reference" className="w-full rounded-lg border px-3 py-2" placeholder="N.º transferencia, voucher, observación..." />
            </label>
          </div>
          <div className="mt-5 flex justify-end">
            <button className="rounded-lg bg-slate-900 px-5 py-2.5 font-medium text-white">Registrar cobro</button>
          </div>
        </form>
      )}

      {order.status !== "completed" && order.status !== "delivered" && (
        <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
          Los cobros se habilitan cuando la orden se encuentra Finalizada y el inventario ya fue descontado.
        </div>
      )}

      <article className="rounded-xl border bg-white p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Cobros registrados</h2>
          <span className="text-sm text-slate-500">{payments?.length ?? 0} registro(s)</span>
        </div>
        {!payments?.length ? (
          <p className="mt-4 text-sm text-slate-500">Todavía no existen cobros para esta orden.</p>
        ) : (
          <div className="mt-4 divide-y">
            {payments.map((payment: any) => {
              const remove = deletePayment.bind(null, order.id, payment.id);
              return (
                <div key={payment.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{methodLabels[payment.payment_method] ?? payment.payment_method} · ${Number(payment.amount).toFixed(2)}</p>
                    <p className="text-sm text-slate-500">
                      {new Date(payment.paid_at).toLocaleString("es-EC")}
                      {payment.reference ? ` · Ref. ${payment.reference}` : ""}
                      {payment.profiles?.full_name ? ` · ${payment.profiles.full_name}` : ""}
                    </p>
                  </div>
                  {order.status !== "delivered" && (
                    <form action={remove}>
                      <button className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">Eliminar</button>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </article>

      {canDeliver && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
          <h2 className="font-semibold text-emerald-950">Orden totalmente pagada</h2>
          <p className="mt-1 text-sm text-emerald-800">Ya puedes emitir el comprobante interno y marcar la orden como entregada.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href={`/dashboard/ordenes/${order.id}/comprobante`} className="rounded-lg border border-emerald-300 bg-white px-4 py-2 font-medium text-emerald-900">
              Ver comprobante
            </Link>
            <form action={deliver}>
              <button className="rounded-lg bg-emerald-700 px-4 py-2 font-medium text-white">Marcar como entregada</button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-xl border bg-white p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold">${value.toFixed(2)}</p>
    </article>
  );
}
