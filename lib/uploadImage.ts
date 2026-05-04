import { supabase } from "@/lib/supabaseClient"

export async function uploadImage(bucket: string, path: string, file: File): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true, contentType: file.type })

  if (error || !data) {
    console.error(`[uploadImage] Failed to upload to ${bucket}/${path}:`, error)
    return null
  }

  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path)
  return publicUrl
}
