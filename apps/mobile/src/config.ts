export type MobileConfig = Readonly<{ url: string; publishableKey: string }>;

export function readMobileConfig(env: Record<string, string | undefined> = process.env): MobileConfig | null {
  const url = env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !publishableKey || /service_role|sb_secret_/i.test(publishableKey)) return null;
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
  } catch {
    return null;
  }
  return { url, publishableKey };
}
