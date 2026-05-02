"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/components/AuthProvider"

interface TimeResult {
  id: string
  created_at: string
  duration_ms: number
}

const PAGE_SIZE = 10

export default function AllTimes() {
  const { user } = useAuth()
  const [times, setTimes] = useState<TimeResult[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const fetchTimes = async () => {
      try {
        const { data, error } = await supabase
          .from("results")
          .select("id, created_at, duration_ms")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .range(0, PAGE_SIZE - 1)

        if (error) {
          console.error("[AllTimes] Error fetching times:", error)
          setTimes([])
        } else {
          console.log("[AllTimes] Fetched initial times:", data)
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
  }, [user])

  const loadMore = async () => {
    if (!user) return

    try {
      const newOffset = offset + PAGE_SIZE
      const { data, error } = await supabase
        .from("results")
        .select("id, created_at, duration_ms")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .range(newOffset, newOffset + PAGE_SIZE - 1)

      if (error) {
        console.error("[AllTimes] Error loading more:", error)
        return
      }

      console.log("[AllTimes] Loaded more times:", data)
      setTimes((prev) => [...prev, ...(data || [])])
      setOffset(newOffset)
      setHasMore((data?.length || 0) >= PAGE_SIZE)
    } catch (error) {
      console.error("[AllTimes] Unexpected error loading more:", error)
    }
  }

  const formatDuration = (ms: number) => {
    return (ms / 1000).toFixed(1)
  }

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString)
    const dateStr = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    const timeStr = date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
    return { dateStr, timeStr }
  }

  if (loading) {
    return (
      <div>
        <div className="space-y-3">
          {Array.from({ length: 10 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-slate-600 rounded-lg p-4 animate-pulse"
            >
              <div className="flex-1">
                <div className="h-4 bg-slate-500 rounded w-24 mb-2"></div>
                <div className="h-3 bg-slate-500 rounded w-32"></div>
              </div>
              <div className="h-6 bg-slate-500 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (times.length === 0) {
    return <div className="text-slate-400">No times saved yet.</div>
  }

  return (
    <div>
      <div className="space-y-3">
        {times.map((result) => {
          const { dateStr, timeStr } = formatDateTime(result.created_at)
          return (
            <div
              key={result.id}
              className="flex items-center justify-between bg-slate-600 rounded-lg p-4"
            >
              <div className="flex-1">
                <div className="text-sm text-slate-300">{dateStr}</div>
                <div className="text-xs text-slate-400">{timeStr}</div>
              </div>
              <div className="text-lg font-mono font-bold text-yellow-400">
                {formatDuration(result.duration_ms)} s
              </div>
            </div>
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
