import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OrderForm } from "@/components/order-form";
import { createOrder } from "../actions";

export default async function NewOrderPage({ searchParams }: { searchParams: { error?: string; customer_id?: string; vehicle_id?: string } }) {
  const supabase=createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user) redirect("/auth/login");
  const [{data:customers},{data:vehicles},{data:services},{data:products},{data:profiles}] = await Promise.all([
    supabase.from("customers").select("id, full_name, identification").order("full_name"),
    supabase.from("vehicles").select("id, customer_id, plate, brand, model, current_mileage").order("plate"),
    supabase.from("services").select("id, name, price").eq("active",true).order("name"),
    supabase.from("products").select("id, category, brand, name, viscosity, sale_price, stock").eq("active",true).gt("stock",0).order("name"),
    supabase.from("profiles").select("id, full_name, role").eq("active",true).order("full_name"),
  ]);
  return <section className="space-y-6"><div><Link href="/dashboard/ordenes" className="text-sm text-slate-600 hover:underline">← Volver a órdenes</Link><h1 className="mt-2 text-3xl font-bold">Nueva orden de servicio</h1><p className="mt-1 text-slate-600">Selecciona cliente, vehículo, servicios y productos utilizados.</p></div>{searchParams.error&&<div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{searchParams.error}</div>}<OrderForm action={createOrder} customers={(customers??[]) as any} vehicles={(vehicles??[]) as any} services={(services??[]).map((x:any)=>({...x,price:Number(x.price)}))} products={(products??[]).map((x:any)=>({...x,sale_price:Number(x.sale_price),stock:Number(x.stock)}))} profiles={(profiles??[]) as any} defaultCustomerId={searchParams.customer_id} defaultVehicleId={searchParams.vehicle_id}/></section>;
}
