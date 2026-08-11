const servicios = [
  { name: "Cambio de aceite", description: "Aceite y mano de obra según vehículo." },
  { name: "Servicio completo", description: "Cambio de aceite, lavado express y pulverizado." },
  { name: "Cambio de filtros", description: "Filtro de aceite o aire según disponibilidad." },
];

export default function ServiciosPage() {
  return (
    <section>
      <h1 className="text-3xl font-bold">Servicios</h1>
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {servicios.map((service) => (
          <article key={service.name} className="rounded-xl border bg-white p-6">
            <h2 className="font-semibold">{service.name}</h2>
            <p className="mt-2 text-sm text-slate-600">{service.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
