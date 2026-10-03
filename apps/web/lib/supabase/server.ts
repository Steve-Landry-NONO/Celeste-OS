import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "./database.types";
import { sessionCookieOptions, supabaseAdminConfig, supabaseConfig } from "./config";

export async function createServerSupabase(mutable = false) {
  const config = supabaseConfig();
  if (!config) throw new Error("Supabase is not configured");
  const store = await cookies();
  return createServerClient<Database>(config.url, config.key, {
    cookieOptions: sessionCookieOptions,
    cookies: {
      getAll: () => store.getAll(),
      setAll(values) {
        // Server Components are read-only; proxy refreshes their cookies.
        // Server Actions and Route Handlers must persist changes or fail.
        if (mutable) values.forEach(({ name, value, options }) => store.set(name, value, options));
      },
    },
  });
}
export function createAdminSupabase() {
  const config=supabaseAdminConfig();
  if (!config) throw new Error("Supabase server credentials are not configured");
  return createClient<Database>(config.url,config.key,{auth:{persistSession:false,autoRefreshToken:false}});
}
