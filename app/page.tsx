import Link from "next/link";

export default function HomePage() {
  return (
    <section className="grid gap-8 py-16 md:grid-cols-2 md:items-center">
      <div>
        <p className="mb-3 font-semibold text-emerald-700">Proyecto académico full-stack</p>
        <h1 className="text-4xl font-bold tracking-tight md:text-6xl">Control sencillo para servicios de lubricadora</h1>
        <p className="mt-6 text-lg text-slate-600">Clientes, vehículos, órdenes, productos, personal asignado y cobros en un solo flujo.</p>
        <div className="mt-8 flex gap-3">
          <Link className="rounded bg-slate-900 px-5 py-3 text-white" href="/auth/login">Ingresar</Link>
          <Link className="rounded border px-5 py-3" href="/servicios">Ver servicios</Link>
        </div>
      </div>
      <div className="rounded-2xl border bg-white p-8 shadow-sm">
        <h2 className="text-xl font-semibold">Flujo principal</h2>
        <ol className="mt-4 space-y-3 text-slate-600">
          <li>1. Registrar cliente y vehículo</li>
          <li>2. Crear orden de servicio</li>
          <li>3. Agregar aceite, filtros, aditivos y servicios</li>
          <li>4. Asignar técnico y actualizar estado</li>
          <li>5. Registrar cobro y entregar comprobante</li>
        </ol>
      </div>
    </section>
  );
}
