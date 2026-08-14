import { createClient } from "@supabase/supabase-js";

/**
 * Cliente privilegiado de Supabase para operaciones administrativas.
 *
 * IMPORTANTE:
 * - Solo debe importarse desde Server Actions / Route Handlers del servidor.
 * - SUPABASE_SERVICE_ROLE_KEY NO debe llevar el prefijo NEXT_PUBLIC_.
 * - La service_role omite RLS, por lo que cada acción que la use debe comprobar
 *   primero los permisos del usuario autenticado.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Falta configurar NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el servidor."
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
