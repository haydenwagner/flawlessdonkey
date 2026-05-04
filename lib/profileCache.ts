import { supabase } from "@/lib/supabaseClient"

export interface CachedProfile {
  display_name: string | null
  avatar_color: string | null
  avatar_url: string | null
}

const cache = new Map<string, CachedProfile>()

export async function getProfiles(userIds: string[]): Promise<Map<string, CachedProfile>> {
  const missing = userIds.filter((id) => !cache.has(id))

  if (missing.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_color, avatar_url")
      .in("id", missing)

    data?.forEach(({ id, display_name, avatar_color, avatar_url }) => {
      cache.set(id, { display_name, avatar_color, avatar_url })
    })
  }

  const result = new Map<string, CachedProfile>()
  for (const id of userIds) {
    const p = cache.get(id)
    if (p) result.set(id, p)
  }
  return result
}

export function setCachedProfile(userId: string, profile: CachedProfile) {
  cache.set(userId, profile)
}
