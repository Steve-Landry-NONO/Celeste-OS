import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { sessionCookieOptions, supabaseConfig } from "./lib/supabase/config";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const config = supabaseConfig();
  if (config) {
    const supabase = createServerClient(config.url, config.key, {
      cookieOptions: sessionCookieOptions,
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(values, headers) {
          values.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
        },
      },
    });
    try {
      const { data } = await supabase.auth.getClaims();
      if (!data?.claims && request.nextUrl.pathname.startsWith("/workspace")) {
        const target = request.nextUrl.clone();
        target.pathname = "/login";
        target.search = "";
        const redirect = NextResponse.redirect(target);
        response.cookies.getAll().forEach(cookie => redirect.cookies.set(cookie));
        response = redirect;
      }
    } catch {
      // The page independently validates the user and fails closed.
    }
  }
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}
export const config = { matcher: ["/workspace/:path*", "/join", "/login", "/register", "/auth/:path*"] };
