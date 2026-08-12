"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type OrderListItem = { id: string; order_number: number; status: string; total: number; created_at: string; customer_name: string; plate: string; vehicle_name: string; technician_name: string };
const labels: Record<string,string> = { pending: "Pendiente", assigned: "Asignada", in_progress: "En proceso", completed: "Finalizada", delivered: "Entregada", cancelled: "Cancelada" };

export function OrderSearch({ orders }: { orders: OrderListItem[] }) {
  const [search, setSearch] = useState(""); const [status, setStatus] = useState("all");
  const filtered = useMemo(() => orders.filter((order) => {
    const q = search.trim().toLowerCase(); const matchesText = !q || `${order.order_number} ${order.customer_name} ${order.plate} ${order.vehicle_name} ${order.technician_name}`.toLowerCase().includes(q); const matchesStatus = status === "all" || order.status === status; return matchesText && matchesStatus;
  }), [orders, search, status]);
  return <div className="space-y-4">
    <div className="grid gap-3 rounded-xl border bg-white p-4 md:grid-cols-[1fr_220px]"><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Buscar por orden, cliente, placa o técnico..." className="rounded-lg border px-3 py-2"/><select value={status} onChange={(e)=>setStatus(e.target.value)} className="rounded-lg border px-3 py-2"><option value="all">Todos los estados</option>{Object.entries(labels).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></div>
    <p className="text-sm text-slate-500">{filtered.length} de {orders.length} orden(es)</p>
    <div className="overflow-hidden rounded-xl border bg-white"><div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Orden</th><th className="px-4 py-3">Cliente / vehículo</th><th className="px-4 py-3">Técnico</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3 text-right">Total</th></tr></thead><tbody className="divide-y">{filtered.map((order)=><tr key={order.id} className="hover:bg-slate-50"><td className="px-4 py-3"><Link className="font-semibold hover:underline" href={`/dashboard/ordenes/${order.id}`}>OS-{String(order.order_number).padStart(5,"0")}</Link><p className="mt-1 text-xs text-slate-500">{new Date(order.created_at).toLocaleDateString("es-EC")}</p></td><td className="px-4 py-3"><p className="font-medium">{order.customer_name}</p><p className="text-slate-500">{order.plate} · {order.vehicle_name}</p></td><td className="px-4 py-3">{order.technician_name || "Sin asignar"}</td><td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium">{labels[order.status] ?? order.status}</span></td><td className="px-4 py-3 text-right font-semibold">${order.total.toFixed(2)}</td></tr>)}</tbody></table></div>{filtered.length===0&&<p className="p-6 text-center text-slate-500">No hay órdenes que coincidan con los filtros.</p>}</div>
  </div>;
}
