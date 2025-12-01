import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("[UPLOAD cover] missing Supabase env vars");
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }

  // Use service role so the upload bypasses RLS on the storage bucket
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const data = await req.formData();
  const file = data.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const fileName = `covers/${Date.now()}-${file.name}`;
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Upload to storage bucket
  const { error } = await supabase.storage
    .from("project-images")
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }

  // PUBLIC URL
  const url = `${supabaseUrl}/storage/v1/object/public/project-images/${fileName}`;

  return NextResponse.json({ url });
}
