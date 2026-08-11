import Link from "next/link";
import { login } from "../actions";

export default function LoginPage({ searchParams }: { searchParams: { error?: string; message?: string } }) {
  return (
    <section className="mx-auto max-w-md rounded-xl border bg-white p-7">
      <h1 className="text-2xl font-bold">Iniciar sesión</h1>
      {searchParams.error && <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">{searchParams.error}</p>}
      {searchParams.message && <p className="mt-4 rounded bg-emerald-50 p-3 text-sm text-emerald-700">{searchParams.message}</p>}
      <form action={login} className="mt-6 space-y-4">
        <input className="w-full rounded border p-3" name="email" type="email" placeholder="Correo" required />
        <input className="w-full rounded border p-3" name="password" type="password" placeholder="Contraseña" minLength={6} required />
        <button className="w-full rounded bg-slate-900 p-3 text-white">Ingresar</button>
      </form>
      <p className="mt-4 text-sm">¿No tienes cuenta? <Link className="underline" href="/auth/register">Regístrate</Link></p>
    </section>
  );
}
