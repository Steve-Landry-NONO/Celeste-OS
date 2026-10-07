export type MobileConfig = Readonly<{ url: string; publishableKey: string }>;

function readJwtRole(key: string): string | null {
  const payload = key.split(".");
  if (payload.length !== 3 || !globalThis.atob) return null;
  try {
    const encoded = payload[1].replaceAll("-", "+").replaceAll("_", "/");
    const decoded = globalThis.atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, "="));
    const role = JSON.parse(decoded) as { role?: unknown };
    return typeof role.role === "string" ? role.role : null;
  } catch {
    return null;
  }
}

export function validateMobileConfig(rawUrl: string | undefined, rawKey: string | undefined): MobileConfig | null {
  const url = rawUrl?.trim();
  const publishableKey = rawKey?.trim();
  if (!url || !publishableKey || /service_role|sb_secret_/i.test(publishableKey)) return null;
  if (!publishableKey.startsWith("sb_publishable_") && readJwtRole(publishableKey) !== "anon") return null;
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
  } catch {
    return null;
  }
  return { url, publishableKey };
}

export function readMobileConfig(env?: Record<string, string | undefined>): MobileConfig | null {
  if (env) return validateMobileConfig(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  // Expo replaces only direct dot-notation reads of EXPO_PUBLIC_* at bundle time.
  return validateMobileConfig(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}
