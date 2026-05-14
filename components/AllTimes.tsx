"use client"

import { useEffect, useState } from "react"
import useSWR from "swr"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/components/AuthProvider"
import { getProfiles, type CachedProfile } from "@/lib/profileCache"
import TimeEntryRow from "@/components/TimeEntryRow"
import GoToTimerCard from "@/components/GoToTimerCard"
import type { ResultsFilter } from "@/components/UserStats"

interface TimeResult {
  id: string
  created_at: string
  duration_ms: number
  user_id?: string
  user_display_name?: string | null
}

const PAGE_SIZE = 10

async function fetchFirstPage(column: string, value: string): Promise<TimeResult[]> {
  const { data, error } = await supabase
    .from("results")
    .select("id, created_at, duration_ms, user_id, user_display_name")
    .eq(column, value)
    .order("created_at", { ascending: false })
    .range(0, PAGE_SIZE - 1)
  if (error) throw error
  return data || []
}

export default function AllTimes({ filter }: { filter: ResultsFilter }) {
  const { user } = useAuth()
  const isTeamView = filter.column === "team_id"

  const { data: firstPage, isLoading } = useSWR(
    filter.value ? ["allTimes", filter.column, filter.value] : null,
    ([, column, value]) => fetchFirstPage(column, value)
  )

  const [extra, setExtra] = useState<TimeResult[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [profileMap, setProfileMap] = useState<Map<string, CachedProfile>>(new Map())

  useEffect(() => {
    if (!firstPage) return
    setExtra([])
    setHasMore(firstPage.length >= PAGE_SIZE)
    if (isTeamView) {
      const ids = [...new Set(firstPage.map((r) => r.user_id).filter(Boolean))] as string[]
      if (ids.length) getProfiles(ids).then(setProfileMap)
    }
  }, [firstPage, isTeamView])

  const times = [...(firstPage || []), ...extra]

  const loadMore = async () => {
    const offset = times.length
    const { data, error } = await supabase
      .from("results")
      .select("id, created_at, duration_ms, user_id, user_display_name")
      .eq(filter.column, filter.value)
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1)

    if (error) {
      console.error("[AllTimes] Error loading more:", error)
      return
    }

    setExtra((prev) => [...prev, ...(data || [])])
    setHasMore((data?.length || 0) >= PAGE_SIZE)

    if (isTeamView && data && data.length > 0) {
      const ids = [...new Set(data.map((r) => r.user_id).filter(Boolean))] as string[]
      getProfiles(ids).then((newProfiles) => {
        setProfileMap((prev) => {
          const next = new Map(prev)
          newProfiles.forEach((p, id) => next.set(id, p))
          return next
        })
      })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-4 animate-pulse">
            {isTeamView && <div className="h-9 w-9 rounded-full bg-slate-500 flex-shrink-0"></div>}
            <div className="flex-1">
              <div className="h-4 bg-slate-500 rounded w-24 mb-2"></div>
              <div className="h-3 bg-slate-500 rounded w-32"></div>
            </div>
            <div className="h-6 bg-slate-500 rounded w-16"></div>
          </div>
        ))}
      </div>
    )
  }

  if (times.length === 0) {
    return (
      <GoToTimerCard
        label="No times recorded yet"
        sublabel="Head to the timer to record your first time."
      />
    )
  }

  return (
    <div>
      <div className="space-y-3">
        {times.map((result) => {
          const profile = isTeamView ? profileMap.get(result.user_id ?? "") : undefined
          const isCurrentUser = result.user_id === user?.id
          return (
            <TimeEntryRow
              key={result.id}
              id={result.id}
              created_at={result.created_at}
              duration_ms={result.duration_ms}
              {...(isTeamView && {
                userId: result.user_id,
                displayName: isCurrentUser
                  ? (user?.user_metadata?.display_name || user?.user_metadata?.full_name || profile?.display_name || result.user_display_name)
                  : (profile?.display_name ?? result.user_display_name),
                avatarColor: isCurrentUser
                  ? (user?.user_metadata?.avatar_color ?? profile?.avatar_color ?? undefined)
                  : (profile?.avatar_color ?? undefined),
                avatarUrl: isCurrentUser
                  ? (user?.user_metadata?.custom_avatar_url ?? profile?.avatar_url ?? undefined)
                  : (profile?.avatar_url ?? undefined),
              })}
            />
          )
        })}
      </div>
      {hasMore && (
        <button
          onClick={loadMore}
          className="w-full mt-6 px-4 py-3 rounded-lg bg-slate-600 hover:bg-slate-500 text-white font-semibold transition"
        >
          Load More
        </button>
      )}
    </div>
  )
}
