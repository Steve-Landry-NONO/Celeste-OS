import { readFileSync, appendFileSync } from "node:fs";
const status = JSON.parse(readFileSync(process.argv[2],"utf8"));
const url = status.API_URL;
const publishable = status.PUBLISHABLE_KEY ?? status.SUPABASE_PUBLISHABLE_KEY ?? status.ANON_KEY;
const admin = status.SECRET_KEY ?? status.SUPABASE_SECRET_KEY ?? status.SERVICE_ROLE_KEY;
if (!url || !publishable || !admin || !["localhost","127.0.0.1"].includes(new URL(url).hostname)) {
  throw new Error("Missing local Supabase test configuration. Available fields: " + Object.keys(status).join(", "));
}
const values = {
  NEXT_PUBLIC_SUPABASE_URL: url,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishable,
  APP_URL: "http://127.0.0.1:3100",
  CELESTE_E2E_REAL_AUTH: "1",
  CELESTE_E2E_LOCAL_ADMIN_KEY: admin,
};
if (!process.env.GITHUB_ENV) throw new Error("This helper is intended for GitHub Actions");
appendFileSync(process.env.GITHUB_ENV,Object.entries(values).map(([k,v])=>k+"="+v+"\n").join(""));
console.log("Local Supabase environment prepared; no credentials printed.");
