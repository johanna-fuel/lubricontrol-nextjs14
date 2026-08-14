type SriVehicle = {
  codigoVehiculo?: number;
  numeroPlaca?: string;
  numeroCamvCpn?: string;
  colorVehiculo1?: string | null;
  colorVehiculo2?: string | null;
  cilindraje?: number | string | null;
  nombreClase?: string | null;
  descripcionMarca?: string | null;
  descripcionModelo?: string | null;
  anioAuto?: number | null;
  descripcionPais?: string | null;
  mensajeMotivoAuto?: string | null;
  aplicaCuota?: boolean;
  fechaUltimaMatricula?: string | null;
  fechaCaducidadMatricula?: string | null;
  fechaCompraRegistro?: string | null;
  fechaRevision?: string | null;
  descripcionCanton?: string | null;
  descripcionServicio?: string | null;
  ultimoAnioPagado?: number | null;
  prohibidoEnajenar?: boolean | string | null;
  observacion?: string | null;
  estadoExoneracion?: string | null;
  verMensajeElectricos?: boolean;
};

type LookupResult = {
  vehicle: SriVehicle | null;
  error: string | null;
};

const SRI_BASE_URL =
  "https://srienlinea.sri.gob.ec/sri-matriculacion-vehicular-recaudacion-servicio-internet/rest";

async function lookupSriVehicle(query: string): Promise<LookupResult> {
  const endpoint = `${SRI_BASE_URL}/BaseVehiculo/obtenerPorNumeroPlacaOPorNumeroCampvOPorNumeroCpn?numeroPlacaCampvCpn=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(endpoint, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return {
        vehicle: null,
        error: `El servicio externo del SRI respondió con HTTP ${response.status}.`,
      };
    }

    const raw = await response.text();
    if (!raw.trim()) {
      return {
        vehicle: null,
        error: "El SRI no devolvió información para el dato consultado.",
      };
    }

    let vehicle: SriVehicle;
    try {
      vehicle = JSON.parse(raw) as SriVehicle;
    } catch {
      return {
        vehicle: null,
        error: "El servicio del SRI devolvió una respuesta que no pudo interpretarse como JSON.",
      };
    }

    if (!vehicle.codigoVehiculo && !vehicle.numeroPlaca && !vehicle.descripcionMarca) {
      return {
        vehicle: null,
        error: "No se encontró información vehicular para el dato ingresado.",
      };
    }

    return { vehicle, error: null };
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    return {
      vehicle: null,
      error: timedOut
        ? "La consulta al SRI tardó demasiado. Inténtalo nuevamente en unos segundos."
        : "No fue posible consultar el servicio vehicular del SRI. Inténtalo nuevamente más tarde.",
    };
  }
}

export default async function SriVehicleLookupPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const query = String(searchParams.q ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");

  const lookup = query
    ? await lookupSriVehicle(query)
    : { vehicle: null, error: null };

  return (
    <section className="space-y-8">
      <div>
        <p className="text-sm font-semibold text-emerald-700">
          Servicio externo · SRI Ecuador
        </p>
        <h1 className="mt-2 text-3xl font-bold">Consulta vehicular</h1>
        <p className="mt-2 max-w-3xl text-slate-600">
          Consulta información vehicular de referencia mediante los servicios usados por SRI en Línea.
          Puedes ingresar una placa, RAMV o CPN. La consulta es dinámica: no existe una placa fija en el código.
        </p>
      </div>

      <form method="get" className="rounded-xl border bg-white p-6">
        <label htmlFor="q" className="block text-sm font-medium">
          Placa, RAMV o CPN
        </label>
        <p className="mt-1 text-sm text-slate-500">
          Ejemplos de formato: MDF0127, T00123456 o B0012345678.
        </p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            id="q"
            name="q"
            defaultValue={query}
            placeholder="Ingrese placa, RAMV o CPN"
            autoComplete="off"
            className="min-w-0 flex-1 rounded-lg border px-4 py-2.5 uppercase"
          />
          <button className="rounded-lg bg-slate-900 px-5 py-2.5 font-medium text-white">
            Consultar SRI
          </button>
        </div>
      </form>

      {lookup.error && (
        <div className="rounded-lg bg-red-50 p-4 text-red-800">{lookup.error}</div>
      )}

      {lookup.vehicle && (
        <article className="rounded-xl border bg-white p-6">
          <div className="flex flex-col gap-1">
            <p className="text-sm text-slate-500">Resultado dinámico para</p>
            <h2 className="text-2xl font-bold">{query}</h2>
          </div>

          <dl className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Item label="Placa" value={lookup.vehicle.numeroPlaca} />
            <Item label="Marca" value={lookup.vehicle.descripcionMarca} />
            <Item label="Modelo" value={lookup.vehicle.descripcionModelo} />
            <Item label="Año" value={lookup.vehicle.anioAuto} />
            <Item label="País" value={lookup.vehicle.descripcionPais} />
            <Item label="RAMV / CPN" value={lookup.vehicle.numeroCamvCpn} />
            <Item label="Clase" value={lookup.vehicle.nombreClase} />
            <Item label="Cilindraje" value={lookup.vehicle.cilindraje} />
            <Item label="Color principal" value={lookup.vehicle.colorVehiculo1} />
            <Item label="Color secundario" value={lookup.vehicle.colorVehiculo2} />
            <Item label="Último año pagado" value={lookup.vehicle.ultimoAnioPagado} />
            <Item label="Estado exoneración" value={lookup.vehicle.estadoExoneracion} />
            <Item label="Servicio" value={lookup.vehicle.descripcionServicio} />
            <Item label="Cantón" value={lookup.vehicle.descripcionCanton} />
            <Item label="Código vehicular SRI" value={lookup.vehicle.codigoVehiculo} />
          </dl>

          {(lookup.vehicle.observacion || lookup.vehicle.mensajeMotivoAuto) && (
            <div className="mt-6 rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
              {lookup.vehicle.observacion || lookup.vehicle.mensajeMotivoAuto}
            </div>
          )}
        </article>
      )}

      <div className="rounded-xl border bg-slate-50 p-5 text-sm text-slate-600">
        <p className="font-medium text-slate-800">Nota académica</p>
        <p className="mt-1">
          Esta sección demuestra consumo de una fuente externa distinta de Supabase mediante
          <code className="mx-1 rounded bg-white px-1.5 py-0.5">fetch</code>
          y <code className="rounded bg-white px-1.5 py-0.5">async/await</code> desde un Server Component.
          El endpoint pertenece a los servicios utilizados por SRI en Línea; no se presenta como una API pública documentada o con garantía de estabilidad.
        </p>
      </div>
    </section>
  );
}

function Item({
  label,
  value,
}: {
  label: string;
  value?: string | number | boolean | null;
}) {
  const display =
    value === null || value === undefined || value === ""
      ? "—"
      : typeof value === "boolean"
        ? value
          ? "Sí"
          : "No"
        : String(value);

  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 font-medium">{display}</dd>
    </div>
  );
}
