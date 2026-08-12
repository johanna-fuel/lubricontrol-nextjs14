import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OrderSearch, type OrderListItem } from "@/components/order-search";

export default async function OrdersPage({ searchParams }: { searchParams: { error?: string; message?: string } }) {
  const supabase=createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user) redirect("/auth/login");
  const {data,error}=await supabase.from("service_orders").select("id, order_number, status, total, created_at, customers!service_orders_customer_id_fkey(full_name), vehicles!service_orders_vehicle_id_fkey(plate, brand, model), profiles!service_orders_assigned_employee_id_fkey(full_name)").order("order_number",{ascending:false});
  const orders: OrderListItem[]=(data??[]).map((row:any)=>({id:row.id,order_number:Number(row.order_number),status:row.status,total:Number(row.total),created_at:row.created_at,customer_name:row.customers?.full_name??"Cliente",plate:row.vehicles?.plate??"—",vehicle_name:[row.vehicles?.brand,row.vehicles?.model].filter(Boolean).join(" "),technician_name:row.profiles?.full_name??""}));
  return <section className="space-y-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-3xl font-bold">Órdenes de servicio</h1><p className="mt-1 text-slate-600">Recepción, trabajos, productos, técnico y valor de cada atención.</p></div><Link href="/dashboard/ordenes/nueva" className="rounded-lg bg-slate-900 px-4 py-2.5 font-medium text-white">+ Nueva orden</Link></div>{searchParams.message&&<div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{searchParams.message}</div>}{searchParams.error&&<div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{searchParams.error}</div>}{error?<div className="rounded-lg bg-red-50 p-4 text-red-800">No se pudieron cargar las órdenes: {error.message}</div>:<OrderSearch orders={orders}/>}</section>;
}
