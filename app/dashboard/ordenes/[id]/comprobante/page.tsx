import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PrintButton } from "@/components/print-button";
import { createClient } from "@/lib/supabase/server";

const methodLabels: Record<string, string> = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
  other: "Otro",
};

export default async function ReceiptPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [{ data: order }, { data: serviceLines }, { data: productLines }, { data: payments }] = await Promise.all([
    supabase
      .from("service_orders")
      .select(
        "id, order_number, status, mileage, subtotal, tax, total, created_at, completed_at, delivered_at, customers!service_orders_customer_id_fkey(full_name, identification, phone, email, address), vehicles!service_orders_vehicle_id_fkey(plate, brand, model, year, color), profiles!service_orders_assigned_employee_id_fkey(full_name)"
      )
      .eq("id", params.id)
      .single(),
    supabase.from("order_services").select("quantity, unit_price, subtotal, services(name)").eq("order_id", params.id),
    supabase.from("order_products").select("quantity, unit_price, subtotal, products(name, brand, viscosity, presentation)").eq("order_id", params.id),
    supabase.from("payments").select("payment_method, amount, reference, paid_at").eq("order_id", params.id).order("paid_at"),
  ]);

  if (!order) notFound();

  const customer: any = order.customers;
  const vehicle: any = order.vehicles;
  const technician: any = order.profiles;
  const paid = (payments ?? []).reduce((sum, payment) => sum + Number(payment.amount), 0);
  const balance = Math.max(0, Number(order.total) - paid);

  return (
    <section className="mx-auto max-w-4xl space-y-6 py-4 print:max-w-none print:space-y-4 print:py-0">
      <div className="flex items-center justify-between gap-4 print:hidden">
        <Link href={`/dashboard/ordenes/${order.id}`} className="text-sm text-slate-600 hover:underline">
          ← Volver a la orden
        </Link>
        <PrintButton />
      </div>

      <article className="rounded-xl border bg-white p-8 print:rounded-none print:border-0 print:p-0">
        <header className="flex flex-col gap-5 border-b pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">LubriControl</p>
            <h1 className="mt-1 text-3xl font-bold">Comprobante interno</h1>
            <p className="mt-1 text-sm text-slate-500">Orden OS-{String(order.order_number).padStart(5, "0")}</p>
          </div>
          <div className="text-sm sm:text-right">
            <p><strong>Fecha:</strong> {new Date(order.created_at).toLocaleString("es-EC")}</p>
            <p><strong>Estado:</strong> {order.status === "delivered" ? "Entregada" : order.status === "completed" ? "Finalizada" : order.status}</p>
            {order.delivered_at && <p><strong>Entrega:</strong> {new Date(order.delivered_at).toLocaleString("es-EC")}</p>}
          </div>
        </header>

        <div className="grid gap-6 border-b py-6 sm:grid-cols-2">
          <div>
            <h2 className="font-semibold">Cliente</h2>
            <p className="mt-2">{customer?.full_name ?? "—"}</p>
            <p className="text-sm text-slate-600">{customer?.identification ?? ""}</p>
            <p className="text-sm text-slate-600">{customer?.phone ?? ""}</p>
            <p className="text-sm text-slate-600">{customer?.email ?? ""}</p>
          </div>
          <div>
            <h2 className="font-semibold">Vehículo</h2>
            <p className="mt-2">{vehicle?.plate ?? "—"} · {[vehicle?.brand, vehicle?.model].filter(Boolean).join(" ")}</p>
            <p className="text-sm text-slate-600">{[vehicle?.year, vehicle?.color].filter(Boolean).join(" · ")}</p>
            <p className="text-sm text-slate-600">Kilometraje: {order.mileage != null ? `${order.mileage} km` : "—"}</p>
            <p className="text-sm text-slate-600">Técnico: {technician?.full_name ?? "—"}</p>
          </div>
        </div>

        <div className="py-6">
          <h2 className="font-semibold">Detalle</h2>
          <div className="mt-3 overflow-hidden rounded-lg border print:rounded-none">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left">
                <tr>
                  <th className="px-3 py-2">Concepto</th>
                  <th className="px-3 py-2 text-right">Cant.</th>
                  <th className="px-3 py-2 text-right">P. unit.</th>
                  <th className="px-3 py-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(serviceLines ?? []).map((line: any, index) => (
                  <ReceiptLine
                    key={`s-${index}`}
                    name={line.services?.name ?? "Servicio"}
                    quantity={Number(line.quantity)}
                    unit={Number(line.unit_price)}
                    subtotal={Number(line.subtotal)}
                  />
                ))}
                {(productLines ?? []).map((line: any, index) => (
                  <ReceiptLine
                    key={`p-${index}`}
                    name={[line.products?.brand, line.products?.name, line.products?.viscosity, line.products?.presentation].filter(Boolean).join(" ") || "Producto"}
                    quantity={Number(line.quantity)}
                    unit={Number(line.unit_price)}
                    subtotal={Number(line.subtotal)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid gap-6 border-t pt-6 sm:grid-cols-2">
          <div>
            <h2 className="font-semibold">Pagos</h2>
            {!payments?.length ? (
              <p className="mt-2 text-sm text-slate-500">Sin cobros registrados.</p>
            ) : (
              <div className="mt-2 space-y-2 text-sm">
                {payments.map((payment, index) => (
                  <div key={`${payment.paid_at}-${index}`} className="flex justify-between gap-4">
                    <span>
                      {methodLabels[payment.payment_method] ?? payment.payment_method}
                      {payment.reference ? ` · ${payment.reference}` : ""}
                    </span>
                    <strong>${Number(payment.amount).toFixed(2)}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>
          <dl className="space-y-2 text-sm sm:text-right">
            <div><dt className="inline text-slate-500">Subtotal: </dt><dd className="inline font-medium">${Number(order.subtotal).toFixed(2)}</dd></div>
            <div><dt className="inline text-slate-500">Impuesto: </dt><dd className="inline font-medium">${Number(order.tax).toFixed(2)}</dd></div>
            <div className="text-lg"><dt className="inline">Total: </dt><dd className="inline font-bold">${Number(order.total).toFixed(2)}</dd></div>
            <div><dt className="inline text-slate-500">Cobrado: </dt><dd className="inline font-medium">${paid.toFixed(2)}</dd></div>
            <div><dt className="inline text-slate-500">Saldo: </dt><dd className="inline font-medium">${balance.toFixed(2)}</dd></div>
          </dl>
        </div>

        <footer className="mt-8 border-t pt-4 text-center text-xs text-slate-500">
          Comprobante interno de servicio. No constituye factura ni comprobante tributario electrónico.
        </footer>
      </article>
    </section>
  );
}

function ReceiptLine({ name, quantity, unit, subtotal }: { name: string; quantity: number; unit: number; subtotal: number }) {
  return (
    <tr>
      <td className="px-3 py-2">{name}</td>
      <td className="px-3 py-2 text-right">{quantity}</td>
      <td className="px-3 py-2 text-right">${unit.toFixed(2)}</td>
      <td className="px-3 py-2 text-right font-medium">${subtotal.toFixed(2)}</td>
    </tr>
  );
}
