type VinResult = {
  Make?: string;
  Model?: string;
  ModelYear?: string;
  Manufacturer?: string;
  VehicleType?: string;
  BodyClass?: string;
  FuelTypePrimary?: string;
  ErrorCode?: string;
  ErrorText?: string;
};

type VpicResponse = {
  Count?: number;
  Message?: string;
  SearchCriteria?: string;
  Results?: VinResult[];
};

async function decodeVin(vin: string): Promise<{ result: VinResult | null; error: string | null }> {
  const endpoint = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${encodeURIComponent(vin)}?format=json`;

  try {
    const response = await fetch(endpoint, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      return { result: null, error: `La API externa respondió con HTTP ${response.status}.` };
    }

    const payload = (await response.json()) as VpicResponse;
    const result = payload.Results?.[0] ?? null;
    if (!result) return { result: null, error: "La API no devolvió información para el VIN indicado." };

    return { result, error: null };
  } catch {
    return { result: null, error: "No fue posible consultar la API vehicular. Inténtalo nuevamente más tarde." };
  }
}

export default async function VinLookupPage({
  searchParams,
}: {
  searchParams: { vin?: string };
}) {
  const vin = String(searchParams.vin ?? "").trim().toUpperCase();
  const lookup = vin ? await decodeVin(vin) : { result: null, error: null };

  return (
    <section className="space-y-8">
      <div>
        <p className="text-sm font-semibold text-emerald-700">API REST externa · NHTSA vPIC</p>
        <h1 className="mt-2 text-3xl font-bold">Consulta de VIN</h1>
        <p className="mt-2 max-w-3xl text-slate-600">
          Esta herramienta consulta información vehicular de referencia mediante fetch + async/await. No sustituye el registro manual del vehículo y puede devolver información limitada para vehículos fuera del mercado estadounidense.
        </p>
      </div>

      <form method="get" className="rounded-xl border bg-white p-6">
        <label htmlFor="vin" className="block text-sm font-medium">VIN / número de chasis</label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <input
            id="vin"
            name="vin"
            defaultValue={vin}
            placeholder="Ej. 5UXWX7C5*BA"
            className="min-w-0 flex-1 rounded-lg border px-4 py-2.5 uppercase"
          />
          <button className="rounded-lg bg-slate-900 px-5 py-2.5 font-medium text-white">Consultar API</button>
        </div>
      </form>

      {lookup.error && <div className="rounded-lg bg-red-50 p-4 text-red-800">{lookup.error}</div>}

      {lookup.result && (
        <article className="rounded-xl border bg-white p-6">
          <div className="flex flex-col gap-1">
            <p className="text-sm text-slate-500">Resultado dinámico para</p>
            <h2 className="text-2xl font-bold">{vin}</h2>
          </div>
          <dl className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Item label="Marca" value={lookup.result.Make} />
            <Item label="Modelo" value={lookup.result.Model} />
            <Item label="Año" value={lookup.result.ModelYear} />
            <Item label="Fabricante" value={lookup.result.Manufacturer} />
            <Item label="Tipo de vehículo" value={lookup.result.VehicleType} />
            <Item label="Carrocería" value={lookup.result.BodyClass} />
            <Item label="Combustible" value={lookup.result.FuelTypePrimary} />
            <Item label="Código de validación" value={lookup.result.ErrorCode} />
          </dl>
          {lookup.result.ErrorText && lookup.result.ErrorCode !== "0" && (
            <p className="mt-6 rounded-lg bg-amber-50 p-4 text-sm text-amber-900">{lookup.result.ErrorText}</p>
          )}
        </article>
      )}
    </section>
  );
}

function Item({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 font-medium">{value || "—"}</dd>
    </div>
  );
}
