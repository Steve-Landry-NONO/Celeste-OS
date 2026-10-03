function isPublicKey(key: string) {
  if (key.startsWith("sb_publishable_")) return true;
  try {
    const payload = key.split(".")[1];
    if (!payload) return false;
    return JSON.parse(atob(payload.replaceAll("-", "+").replaceAll("_", "/"))).role === "anon";
  } catch { return false; }
}
function isSecretKey(key:string) {
  if (key.startsWith("sb_secret_")) return true;
  try {
    const payload=key.split(".")[1];
    if (!payload) return false;
    return JSON.parse(atob(payload.replaceAll("-","+").replaceAll("_","/"))).role==="service_role";
  } catch { return false; }
}
function safeUrl(value: string) {
  try {
    const url = new URL(value);
    const localHttp = url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname);
    if ((url.protocol !== "https:" && !localHttp) || url.username || url.password || url.search || url.hash) return null;
    return url;
  } catch { return null; }
}
export function supabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key || !isPublicKey(key) || !safeUrl(url)) return null;
  return { url, key };
}
export function supabaseAdminConfig() {
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.SUPABASE_SECRET_KEY;
  if (!url || !key || !isSecretKey(key) || !safeUrl(url)) return null;
  return {url,key};
}
export function appOrigin() {
  const value = process.env.APP_URL;
  return value ? safeUrl(value)?.origin ?? null : null;
}
export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};
