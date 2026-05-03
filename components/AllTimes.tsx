"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/components/AuthProvider"
import TimeEntryRow from "@/components/TimeEntryRow"
import type { ResultsFilter } from "@/components/UserStats"

interface TimeResult {
  id: string
  created_at: string
  duration_ms: number
  user_id?: string
  user_display_name?: string | null
}

const PAGE_SIZE = 10

export default function AllTimes({ filter }: { filter: ResultsFilter }) {
  const { user } = useAuth()
  const [times, setTimes] = useState<TimeResult[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)

  const isTeamView = filter.column === "team_id"

  useEffect(() => {
    if (!filter.value) return

    setLoading(true)
    setTimes([])
    setOffset(0)

    const fetchTimes = async () => {
      try {
        const { data, error } = await supabase
          .from("results")
          .select("id, created_at, duration_ms, user_id, user_display_name")
          .eq(filter.column, filter.value)
          .order("created_at", { ascending: false })
          .range(0, PAGE_SIZE - 1)

        if (error) {
          console.error("[AllTimes] Error fetching times:", error)
          setTimes([])
        } else {
          setTimes(data || [])
          setHasMore((data?.length || 0) >= PAGE_SIZE)
        }
      } catch (error) {
        console.error("[AllTimes] Unexpected error:", error)
        setTimes([])
      } finally {
        setLoading(false)
      }
    }

    fetchTimes()
  }, [filter.column, filter.value])

  const loadMore = async () => {
    try {
      const newOffset = offset + PAGE_SIZE
      const { data, error } = await supabase
        .from("results")
        .select("id, created_at, duration_ms, user_id, user_display_name")
        .eq(filter.column, filter.value)
        .order("created_at", { ascending: false })
        .range(newOffset, newOffset + PAGE_SIZE - 1)

      if (error) {
        console.error("[AllTimes] Error loading more:", error)
        return
      }

      setTimes((prev) => [...prev, ...(data || [])])
      setOffset(newOffset)
      setHasMore((data?.length || 0) >= PAGE_SIZE)
    } catch (error) {
      console.error("[AllTimes] Unexpected error loading more:", error)
    }
  }

  if (loading) {
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
      <div className="py-10 text-center">
        <p className="text-slate-400 mb-5">No times recorded yet.</p>
        <Link
          href="/"
          className="inline-block rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2.5 text-sm transition"
        >
          Go to Timer
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="space-y-3">
        {times.map((result) => (
          <TimeEntryRow
            key={result.id}
            id={result.id}
            created_at={result.created_at}
            duration_ms={result.duration_ms}
            userId={result.user_id}
            displayName={result.user_display_name}
            avatarColor={
              result.user_id === user?.id
                ? user?.user_metadata?.avatar_color
                : undefined
            }
          />
        ))}
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
