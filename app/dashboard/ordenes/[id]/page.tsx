import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireActiveProfile, canOperateReception } from "@/lib/auth/permissions";
import { deleteOrder, deliverOrder, finalizeOrder, startOrder } from "../actions";

const labels: Record<string, string> = {
  pending: "Pendiente",
  assigned: "Asignada",
  in_progress: "En proceso",
  completed: "Finalizada",
  delivered: "Entregada",
  cancelled: "Cancelada",
};

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string; message?: string };
}) {
  const { supabase, profile } = await requireActiveProfile();
  const reception = canOperateReception(profile.role);

  const [{ data: order }, { data: serviceLines }, { data: productLines }, { data: payments }] = await Promise.all([
    supabase
      .from("service_orders")
      .select(
        "id, order_number, status, mileage, observations, subtotal, tax, total, created_at, completed_at, delivered_at, inventory_applied, inventory_applied_at, assigned_employee_id, customers!service_orders_customer_id_fkey(id, full_name, identification, phone), vehicles!service_orders_vehicle_id_fkey(id, plate, brand, model, year), profiles!service_orders_assigned_employee_id_fkey(full_name)"
      )
      .eq("id", params.id)
      .single(),
    supabase.from("order_services").select("id, quantity, unit_price, subtotal, services(name)").eq("order_id", params.id),
    supabase.from("order_products").select("id, quantity, unit_price, subtotal, products(name, brand, viscosity, category)").eq("order_id", params.id),
    supabase.from("payments").select("id, amount, payment_method, paid_at").eq("order_id", params.id),
  ]);

  if (!order) notFound();

  const customer: any = order.customers;
  const vehicle: any = order.vehicles;
  const technician: any = order.profiles;
  const paid = (payments ?? []).reduce((sum, payment) => sum + Number(payment.amount), 0);
  const remaining = Math.max(0, Number(order.total) - paid);
  const remove = deleteOrder.bind(null, order.id);
  const start = startOrder.bind(null, order.id);
  const finalize = finalizeOrder.bind(null, order.id);
  const deliver = deliverOrder.bind(null, order.id);
  const editable = reception && ["pending", "assigned", "in_progress", "cancelled"].includes(order.status) && !order.inventory_applied;
  const canStart = ["pending", "assigned"].includes(order.status) && !order.inventory_applied;
  const canFinalize = ["in_progress", "completed"].includes(order.status) && !order.inventory_applied;
  const canDeliver = reception && order.status === "completed" && order.inventory_applied && remaining <= 0.00001;

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/dashboard/ordenes" className="text-sm text-slate-600 hover:underline">
            ← Volver a órdenes
          </Link>
          <h1 className="mt-2 text-3xl font-bold">OS-{String(order.order_number).padStart(5, "0")}</h1>
          <p className="mt-1 text-slate-500">
            {labels[order.status] ?? order.status} · {new Date(order.created_at).toLocaleString("es-EC")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {editable && (
            <Link href={`/dashboard/ordenes/${order.id}/editar`} className="rounded-lg border bg-white px-4 py-2 font-medium">
              Editar / estado
            </Link>
          )}
          {canStart && (
            <form action={start}>
              <button className="rounded-lg bg-blue-700 px-4 py-2 font-medium text-white">Iniciar trabajo</button>
            </form>
          )}
          {canFinalize && (
            <form action={finalize}>
              <button className="rounded-lg bg-emerald-700 px-4 py-2 font-medium text-white">Finalizar y descontar stock</button>
            </form>
          )}
          {reception && order.status === "completed" && (
            <Link href={`/dashboard/ordenes/${order.id}/pagos`} className="rounded-lg bg-slate-900 px-4 py-2 font-medium text-white">
              Registrar cobro
            </Link>
          )}
          {(paid > 0 || order.status === "delivered") && (
            <Link href={`/dashboard/ordenes/${order.id}/comprobante`} className="rounded-lg border bg-white px-4 py-2 font-medium">
              Comprobante
            </Link>
          )}
          {canDeliver && (
            <form action={deliver}>
              <button className="rounded-lg bg-emerald-700 px-4 py-2 font-medium text-white">Marcar entregada</button>
            </form>
          )}
          {reception && ["pending", "cancelled"].includes(order.status) && !order.inventory_applied && (
            <form action={remove}>
              <button className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 font-medium text-red-700">Eliminar</button>
            </form>
          )}
        </div>
      </div>

      {searchParams.message && <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{searchParams.message}</div>}
      {searchParams.error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{searchParams.error}</div>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FlowCard title="Estado" value={labels[order.status] ?? order.status} />
        <FlowCard title="Inventario" value={order.inventory_applied ? "Descontado" : "Pendiente"} />
        <FlowCard title="Cobrado" value={`$${paid.toFixed(2)}`} />
        <FlowCard title="Saldo" value={`$${remaining.toFixed(2)}`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <article className="rounded-xl border bg-white p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold">Recepción</h2>
          <dl className="mt-5 grid gap-5 sm:grid-cols-2">
            <Detail label="Cliente" value={customer?.full_name} />
            <Detail label="Identificación" value={customer?.identification} />
            <Detail label="Vehículo" value={`${vehicle?.plate ?? ""} · ${vehicle?.brand ?? ""} ${vehicle?.model ?? ""}`} />
            <Detail label="Kilometraje" value={order.mileage != null ? `${order.mileage} km` : null} />
            <Detail label="Técnico" value={technician?.full_name} />
            <Detail label="Estado" value={labels[order.status] ?? order.status} />
            <Detail label="Inventario aplicado" value={order.inventory_applied_at ? new Date(order.inventory_applied_at).toLocaleString("es-EC") : "No"} />
            <Detail label="Finalización" value={order.completed_at ? new Date(order.completed_at).toLocaleString("es-EC") : null} />
            <div className="sm:col-span-2"><Detail label="Observaciones" value={order.observations} /></div>
          </dl>
        </article>

        <article className="rounded-xl border bg-slate-900 p-6 text-white">
          <p className="text-sm text-slate-300">Total</p>
          <p className="mt-2 text-4xl font-bold">${Number(order.total).toFixed(2)}</p>
          <div className="mt-5 space-y-2 text-sm text-slate-300">
            <p>Subtotal: ${Number(order.subtotal).toFixed(2)}</p>
            <p>Impuesto: ${Number(order.tax).toFixed(2)}</p>
            <p>Cobrado: ${paid.toFixed(2)}</p>
            <p>Saldo: ${remaining.toFixed(2)}</p>
          </div>
        </article>
      </div>

      {order.status === "assigned" && (
        <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-900">Pasa la orden a <strong>En proceso</strong> desde “Editar / estado” cuando el técnico empiece el trabajo.</div>
      )}
      {["in_progress", "completed"].includes(order.status) && !order.inventory_applied && (
        <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900">Al finalizar, el botón <strong>Finalizar y descontar stock</strong> descuenta los productos una sola vez y deja la orden lista para cobro.</div>
      )}
      {order.status === "completed" && remaining > 0 && (
        <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900">La orden está finalizada. Registra uno o varios cobros hasta completar el saldo.</div>
      )}
      {order.status === "completed" && remaining <= 0.00001 && (
        <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-900">La orden está totalmente pagada. Puedes imprimir el comprobante interno y marcarla como entregada.</div>
      )}
      {order.status === "delivered" && (
        <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-900">Flujo completado: servicio finalizado, inventario aplicado, cobro completo y vehículo entregado.</div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Lines
          title="Servicios"
          lines={(serviceLines ?? []).map((line: any) => ({
            name: line.services?.name ?? "Servicio",
            quantity: Number(line.quantity),
            unit: Number(line.unit_price),
            subtotal: Number(line.subtotal),
          }))}
        />
        <Lines
          title="Productos"
          lines={(productLines ?? []).map((line: any) => ({
            name: [line.products?.brand, line.products?.name, line.products?.viscosity].filter(Boolean).join(" ") || "Producto",
            quantity: Number(line.quantity),
            unit: Number(line.unit_price),
            subtotal: Number(line.subtotal),
          }))}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href={`/dashboard/clientes/${customer?.id}`} className="rounded-lg border bg-white px-4 py-2">Abrir cliente</Link>
        <Link href={`/dashboard/vehiculos/${vehicle?.id}`} className="rounded-lg border bg-white px-4 py-2">Abrir vehículo</Link>
        {reception && (order.status === "completed" || order.status === "delivered") && (
          <Link href={`/dashboard/ordenes/${order.id}/pagos`} className="rounded-lg border bg-white px-4 py-2">Cobros</Link>
        )}
      </div>
    </section>
  );
}

function FlowCard({ title, value }: { title: string; value: string }) {
  return <article className="rounded-xl border bg-white p-5"><p className="text-sm text-slate-500">{title}</p><p className="mt-2 text-xl font-bold">{value}</p></article>;
}

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  return <div><dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1">{value || "—"}</dd></div>;
}

function Lines({ title, lines }: { title: string; lines: { name: string; quantity: number; unit: number; subtotal: number }[] }) {
  return (
    <article className="rounded-xl border bg-white p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      {lines.length === 0 ? <p className="mt-4 text-sm text-slate-500">Sin registros.</p> : (
        <div className="mt-4 divide-y">
          {lines.map((line, index) => (
            <div key={`${line.name}-${index}`} className="flex items-center justify-between gap-4 py-3">
              <div><p className="font-medium">{line.name}</p><p className="text-sm text-slate-500">{line.quantity} × ${line.unit.toFixed(2)}</p></div>
              <p className="font-semibold">${line.subtotal.toFixed(2)}</p>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
