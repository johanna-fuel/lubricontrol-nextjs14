import Link from "next/link";
import { ProductForm } from "@/components/product-form";
import { createProduct } from "../actions";
export default function NewProductPage({ searchParams }: { searchParams: { error?: string } }) { return <section className="mx-auto max-w-3xl space-y-6"><div><Link href="/dashboard/productos" className="text-sm text-slate-600 hover:underline">← Volver a productos</Link><h1 className="mt-2 text-3xl font-bold">Nuevo producto</h1></div>{searchParams.error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{searchParams.error}</div>}<ProductForm action={createProduct} submitLabel="Guardar producto" /></section>; }
