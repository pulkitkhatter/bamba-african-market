import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";

const supabaseUrl = process.env["SUPABASE_URL"];
const serviceRoleKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];

// We only use Supabase Storage here, but the client always sets up a
// Realtime websocket connection internally, which needs a WebSocket
// implementation on Node <22 (no built-in global WebSocket yet).
export const supabaseAdmin =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, {
        realtime: { transport: WebSocket as never },
      })
    : null;

const BUCKET = "bamba-market-images";

// Bamba African Market shares its Supabase project with Z Halal Restaurant
// (same owner, one project) but uses its own storage bucket so uploads for
// the two sites never mix.
export async function ensureBucketExists(): Promise<void> {
  if (!supabaseAdmin) return;

  const { data: buckets, error } = await supabaseAdmin.storage.listBuckets();
  if (error) throw new Error(`Could not list storage buckets: ${error.message}`);

  if (buckets.some((b) => b.name === BUCKET)) return;

  const { error: createError } = await supabaseAdmin.storage.createBucket(BUCKET, {
    public: true,
  });
  if (createError) {
    throw new Error(`Could not create storage bucket: ${createError.message}`);
  }
}

export async function uploadImage(file: Express.Multer.File): Promise<string> {
  if (!supabaseAdmin) {
    throw new Error(
      "Supabase storage is not configured (missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)",
    );
  }

  const ext = file.originalname.split(".").pop() ?? "jpg";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, file.buffer, { contentType: file.mimetype });

  if (error) {
    throw new Error(`Image upload failed: ${error.message}`);
  }

  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
