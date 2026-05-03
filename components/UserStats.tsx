"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { formatDuration } from "@/lib/utils"

export interface ResultsFilter {
  column: "user_id" | "team_id"
  value: string
}

interface Stats {
  totalRuns: number
  averageTime: number
  longestTime: number
  shortestTime: number
}

export default function UserStats({ filter }: { filter: ResultsFilter }) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!filter.value) return

    const fetchStats = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from("results")
          .select("duration_ms")
          .eq(filter.column, filter.value)

        if (error) {
          console.error("[UserStats] Error fetching stats:", error)
          setStats(null)
          return
        }

        if (!data || data.length === 0) {
          setStats({ totalRuns: 0, averageTime: 0, longestTime: 0, shortestTime: 0 })
          return
        }

        const durations = data.map((r) => r.duration_ms)
        const totalRuns = durations.length
        const averageTime = durations.reduce((a, b) => a + b, 0) / totalRuns
        const longestTime = Math.max(...durations)
        const shortestTime = Math.min(...durations)

        setStats({ totalRuns, averageTime, longestTime, shortestTime })
      } catch (error) {
        console.error("[UserStats] Unexpected error:", error)
        setStats(null)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [filter.column, filter.value])

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-slate-700 rounded-lg p-6 shadow-xl animate-pulse">
            <div className="h-4 bg-slate-500 rounded w-20 mb-2"></div>
            <div className="h-8 bg-slate-500 rounded w-16"></div>
          </div>
        ))}
      </div>
    )
  }

  if (!stats) {
    return <div className="text-slate-400">Unable to load stats.</div>
  }

  return (
    <div className="grid grid-cols-2 gap-4 mb-8">
      <div className="bg-slate-700 rounded-lg p-5 shadow-xl">
        <div className="text-sm text-slate-400 mb-2">Total Piss</div>
        <div className="text-3xl font-bold text-yellow-400">{stats.totalRuns}</div>
      </div>
      <div className="bg-slate-700 rounded-lg p-5 shadow-xl">
        <div className="text-sm text-slate-400 mb-2">Average Piss</div>
        <div className="text-3xl font-bold text-yellow-400">{formatDuration(stats.averageTime)} s</div>
      </div>
      <div className="bg-slate-700 rounded-lg p-5 shadow-xl">
        <div className="text-sm text-slate-400 mb-2">Worst Piss</div>
        <div className="text-3xl font-bold text-red-400">{formatDuration(stats.shortestTime)} s</div>
      </div>
      <div className="bg-slate-700 rounded-lg p-5 shadow-xl">
        <div className="text-sm text-slate-400 mb-2">Best Piss</div>
        <div className="text-3xl font-bold text-green-400">{formatDuration(stats.longestTime)} s</div>
      </div>
    </div>
  )
}
