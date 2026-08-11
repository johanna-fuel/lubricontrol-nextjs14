export default function OrderDetailPage({ params }: { params: { id: string } }) {
  return (
    <section>
      <h1 className="text-3xl font-bold">Orden #{params.id}</h1>
      <p className="mt-3 text-slate-600">Ruta dinámica preparada para mostrar cliente, vehículo, servicios, productos, técnico y cobro.</p>
    </section>
  );
}
