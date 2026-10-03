import { test } from "node:test";
import assert from "node:assert/strict";
import { supabaseAdminConfig, supabaseConfig, appOrigin } from "../lib/supabase/config.ts";
function key(role) { return "header." + Buffer.from(JSON.stringify({role})).toString("base64url") + ".signature"; }
test("configuration excludes secret and service-role keys from public clients", () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL="https://test.supabase.co";
  for (const value of ["sb_secret_test",key("service_role"),"invalid"]) {
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=value;
    assert.equal(supabaseConfig(),null);
  }
  for (const value of ["sb_publishable_test",key("anon")]) {
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=value;
    assert.equal(supabaseConfig()?.key,value);
  }
});
test("server credentials accept only secret or service-role keys", () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL="https://test.supabase.co";
  for (const value of ["sb_publishable_test",key("anon"),"invalid"]) {
    process.env.SUPABASE_SECRET_KEY=value;
    assert.equal(supabaseAdminConfig(),null);
  }
  for (const value of ["sb_secret_test",key("service_role")]) {
    process.env.SUPABASE_SECRET_KEY=value;
    assert.equal(supabaseAdminConfig()?.key,value);
  }
});
test("only HTTPS or HTTP loopback origins are accepted", () => {
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_publishable_test";
  for (const value of ["http://example.com","ftp://localhost","https://user:password@example.com","https://example.com?token=x"]) {
    process.env.NEXT_PUBLIC_SUPABASE_URL=value;
    process.env.APP_URL=value;
    assert.equal(supabaseConfig(),null);
    assert.equal(appOrigin(),null);
  }
  process.env.APP_URL="http://127.0.0.1:3100";
  assert.equal(appOrigin(),"http://127.0.0.1:3100");
});
