import { readMobileConfig } from "../src/config";

function legacyJwt(role: string) {
  const payload = globalThis.btoa(JSON.stringify({ role })).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
  return `header.${payload}.signature`;
}

describe("mobile configuration", () => {
  test("accepts a publishable Supabase configuration", () => {
    expect(readMobileConfig({ EXPO_PUBLIC_SUPABASE_URL: "https://example.supabase.co", EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test" })).toEqual({ url: "https://example.supabase.co", publishableKey: "sb_publishable_test" });
  });
  test.each(["service_role_value", "sb_secret_private"])("rejects a server secret: %s", (key: string) => {
    expect(readMobileConfig({ EXPO_PUBLIC_SUPABASE_URL: "https://example.supabase.co", EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key })).toBeNull();
  });
  test("accepts only the anon role from legacy JWT keys", () => {
    expect(readMobileConfig({ EXPO_PUBLIC_SUPABASE_URL: "https://example.supabase.co", EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: legacyJwt("anon") })?.publishableKey).toBe(legacyJwt("anon"));
    expect(readMobileConfig({ EXPO_PUBLIC_SUPABASE_URL: "https://example.supabase.co", EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: legacyJwt("service_role") })).toBeNull();
    expect(readMobileConfig({ EXPO_PUBLIC_SUPABASE_URL: "https://example.supabase.co", EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "header.invalid.signature" })).toBeNull();
  });
  test("fails closed on a malformed endpoint", () => {
    expect(readMobileConfig({ EXPO_PUBLIC_SUPABASE_URL: "not-a-url", EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test" })).toBeNull();
  });
});
