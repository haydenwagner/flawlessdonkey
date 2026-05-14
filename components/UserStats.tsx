"use client"

import useSWR from "swr"
import { supabase } from "@/lib/supabaseClient"
import { formatDuration } from "@/lib/utils"
import { getTimerColor } from "@/lib/timerColor"

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

async function fetchStats(column: string, value: string): Promise<Stats> {
  const { data, error } = await supabase
    .from("results")
    .select("duration_ms")
    .eq(column, value)

  if (error) throw error

  if (!data || data.length === 0) {
    return { totalRuns: 0, averageTime: 0, longestTime: 0, shortestTime: 0 }
  }

  const durations = data.map((r) => r.duration_ms)
  const totalRuns = durations.length
  const averageTime = durations.reduce((a, b) => a + b, 0) / totalRuns
  const longestTime = Math.max(...durations)
  const shortestTime = Math.min(...durations)

  return { totalRuns, averageTime, longestTime, shortestTime }
}

export default function UserStats({ filter, omitMinMax }: { filter: ResultsFilter; omitMinMax?: boolean }) {
  const { data: stats, isLoading, error } = useSWR(
    filter.value ? ["userStats", filter.column, filter.value] : null,
    ([, column, value]) => fetchStats(column, value)
  )

  const skeletonCount = omitMinMax ? 2 : 4

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 mb-8">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 animate-pulse">
            <div className="h-4 bg-slate-500 rounded w-20 mb-2"></div>
            <div className="h-8 bg-slate-500 rounded w-16"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error || !stats) {
    return <div className="text-slate-400">Unable to load stats.</div>
  }

  return (
    <div className="grid grid-cols-2 gap-4 mb-8">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <div className="text-sm text-slate-400 mb-2">Total Pisses</div>
        <div className="text-3xl font-bold text-yellow-400">{stats.totalRuns}</div>
      </div>
      <div className={`rounded-2xl p-5 border ${stats.averageTime / 1000 >= 60 ? "bg-white border-slate-200" : "bg-white/5 border-white/10"}`}>
        <div className={`text-sm mb-2 ${stats.averageTime / 1000 >= 60 ? "text-slate-700" : "text-slate-400"}`}>Average Time</div>
        <div className="text-3xl font-bold" style={{ color: getTimerColor(stats.averageTime / 1000) }}>{formatDuration(stats.averageTime)}</div>
      </div>
      {!omitMinMax && (
        <>
          <div className={`rounded-2xl p-5 border ${stats.shortestTime / 1000 >= 60 ? "bg-white border-slate-200" : "bg-white/5 border-white/10"}`}>
            <div className={`text-sm mb-2 ${stats.shortestTime / 1000 >= 60 ? "text-slate-700" : "text-slate-400"}`}>Worst Piss</div>
            <div className="text-3xl font-bold" style={{ color: getTimerColor(stats.shortestTime / 1000) }}>{formatDuration(stats.shortestTime)}</div>
          </div>
          <div className={`rounded-2xl p-5 border ${stats.longestTime / 1000 >= 60 ? "bg-white border-slate-200" : "bg-white/5 border-white/10"}`}>
            <div className={`text-sm mb-2 ${stats.longestTime / 1000 >= 60 ? "text-slate-700" : "text-slate-400"}`}>Best Piss</div>
            <div className="text-3xl font-bold" style={{ color: getTimerColor(stats.longestTime / 1000) }}>{formatDuration(stats.longestTime)}</div>
          </div>
        </>
      )}
    </div>
  )
}
