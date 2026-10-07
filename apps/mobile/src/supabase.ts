import "react-native-url-polyfill/auto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readMobileConfig } from "./config";
import { sessionStorage } from "./session-storage";

let client: SupabaseClient | null = null;

export function getSupabase() {
  if (client) return client;
  const config = readMobileConfig();
  if (!config) throw new Error("MOBILE_CONFIG_MISSING");
  client = createClient(config.url, config.publishableKey, {
    auth: { storage: sessionStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
  });
  return client;
}
