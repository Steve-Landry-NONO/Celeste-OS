import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "../../../lib/supabase/server";
import { supabaseConfig } from "../../../lib/supabase/config";
export async function GET(request: NextRequest) {
  let success = false;
  if (supabaseConfig()) {
    try {
      const client = await createServerSupabase(true);
      const code = request.nextUrl.searchParams.get("code");
      const tokenHash = request.nextUrl.searchParams.get("token_hash");
      const type = request.nextUrl.searchParams.get("type");
      if (code) success = !(await client.auth.exchangeCodeForSession(code)).error;
      else if (tokenHash && (type === "signup" || type === "email")) success = !(await client.auth.verifyOtp({token_hash:tokenHash,type})).error;
    } catch { success = false; }
  }
  const target = new URL(success ? "/workspace" : "/login",request.url);
  if (!success) target.searchParams.set("confirmation","failed");
  const response = NextResponse.redirect(target);
  response.headers.set("Cache-Control","private, no-store, max-age=0");
  response.headers.set("Referrer-Policy","no-referrer");
  return response;
}
