import { NextResponse } from "next/server";
import { createServerSupabase } from "../../../../lib/supabase/server";

export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return new NextResponse("Fichier introuvable",{status:404});
  try {
    const client=await createServerSupabase();
    const {data:{user},error:authError}=await client.auth.getUser();
    if (authError || !user) return NextResponse.redirect(new URL("/login",_request.url),303);
    const file=await client.from("scope_files").select("object_key,file_name").eq("id",id).maybeSingle();
    if (file.error || !file.data) return new NextResponse("Fichier introuvable",{status:404,headers:{"Cache-Control":"private, no-store"}});
    const signed=await client.storage.from("celeste-private").createSignedUrl(file.data.object_key,60,{download:file.data.file_name});
    if (signed.error || !signed.data?.signedUrl) return new NextResponse("Téléchargement indisponible",{status:503,headers:{"Cache-Control":"private, no-store"}});
    return NextResponse.redirect(signed.data.signedUrl,303);
  } catch { return new NextResponse("Téléchargement indisponible",{status:503,headers:{"Cache-Control":"private, no-store"}}); }
}
