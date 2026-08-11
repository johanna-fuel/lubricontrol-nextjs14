import Link from "next/link";
import { register } from "../actions";

export default function RegisterPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <section className="mx-auto max-w-md rounded-xl border bg-white p-7">
      <h1 className="text-2xl font-bold">Crear cuenta</h1>
      {searchParams.error && <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">{searchParams.error}</p>}
      <form action={register} className="mt-6 space-y-4">
        <input className="w-full rounded border p-3" name="full_name" placeholder="Nombre completo" required />
        <input className="w-full rounded border p-3" name="email" type="email" placeholder="Correo" required />
        <input className="w-full rounded border p-3" name="password" type="password" placeholder="Contraseña" minLength={6} required />
        <button className="w-full rounded bg-slate-900 p-3 text-white">Registrarme</button>
      </form>
      <p className="mt-4 text-sm">¿Ya tienes cuenta? <Link className="underline" href="/auth/login">Ingresa</Link></p>
    </section>
  );
}
