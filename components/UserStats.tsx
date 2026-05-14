"use client"

import useSWR from "swr"
import { supabase } from "@/lib/supabaseClient"
import { formatDuration } from "@/lib/utils"
import { getTimerColor } from "@/lib/timerColor"

export interface ResultsFilter {
  column: "user_id" | "team_id"
  value: string
}

export interface Stats {
  totalRuns: number
  averageTime: number
  longestTime: number
  shortestTime: number
  totalDuration: number
}

async function fetchStats(column: string, value: string): Promise<Stats> {
  const { data, error } = await supabase
    .from("results")
    .select("duration_ms")
    .eq(column, value)

  if (error) throw error

  if (!data || data.length === 0) {
    return { totalRuns: 0, averageTime: 0, longestTime: 0, shortestTime: 0, totalDuration: 0 }
  }

  const durations = data.map((r) => r.duration_ms)
  const totalRuns = durations.length
  const totalDuration = durations.reduce((a, b) => a + b, 0)
  const averageTime = totalDuration / totalRuns
  const longestTime = Math.max(...durations)
  const shortestTime = Math.min(...durations)

  return { totalRuns, averageTime, longestTime, shortestTime, totalDuration }
}

interface TimeSegment {
  value: string
  label: string
}

function parseTotalMs(ms: number): TimeSegment[] {
  if (ms < 60_000) {
    return [{ value: (ms / 1000).toFixed(1), label: "s" }]
  }
  if (ms < 3_600_000) {
    const m = Math.floor(ms / 60_000)
    const s = Math.floor((ms % 60_000) / 1000)
    return [{ value: String(m), label: "m" }, { value: String(s), label: "s" }]
  }
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  const s = Math.floor((ms % 60_000) / 1000)
  return [{ value: String(h), label: "h" }, { value: String(m), label: "m" }, { value: String(s), label: "s" }]
}

function TickSegment({ value, label }: { value: string; label: string }) {
  return (
    <span
      className="inline-flex items-baseline gap-0.5"
      style={{ animation: "tick-up 0.3s ease-out" }}
    >
      <span className="text-4xl font-bold text-white">{value}</span>
      <span className="text-xl font-semibold text-slate-400">{label}</span>
    </span>
  )
}

export default function UserStats({ filter, omitMinMax }: { filter: ResultsFilter; omitMinMax?: boolean }) {
  const { data: stats, isLoading, error } = useSWR(
    filter.value ? ["userStats", filter.column, filter.value] : null,
    ([, column, value]) => fetchStats(column, value)
  )

  const skeletonCount = omitMinMax ? 2 : 4

  if (isLoading) {
    return (
      <>
        <div className="relative mb-4">
          <div className="absolute left-0 w-1/4 top-1/2 -translate-y-1/2 h-px bg-gradient-to-r from-transparent to-white/20" />
          <div className="absolute right-0 w-1/4 top-1/2 -translate-y-1/2 h-px bg-gradient-to-l from-transparent to-white/20" />
          <div className="relative w-full sm:w-1/2 mx-auto bg-white/5 border border-white/10 rounded-2xl p-5 animate-pulse">
            <div className="h-3 bg-slate-700 rounded w-24 mb-4 mx-auto"></div>
            <div className="h-10 bg-slate-700 rounded w-36 mx-auto"></div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-8">
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 animate-pulse">
              <div className="h-4 bg-slate-500 rounded w-20 mb-2"></div>
              <div className="h-8 bg-slate-500 rounded w-16"></div>
            </div>
          ))}
        </div>
      </>
    )
  }

  if (error || !stats) {
    return <div className="text-slate-400">Unable to load stats.</div>
  }

  return (
    <>
      <div className="relative mb-4">
        {/* Side rails — extend inward from each edge, stopping at the card */}
        <div className="absolute left-0 w-1/4 top-1/2 -translate-y-1/2 h-px bg-gradient-to-r from-transparent to-white/20" />
        <div className="absolute right-0 w-1/4 top-1/2 -translate-y-1/2 h-px bg-gradient-to-l from-transparent to-white/20" />
        {/* 50% centered card */}
        <div className="relative w-full sm:w-1/2 mx-auto bg-white/5 border border-white/10 rounded-2xl p-5 text-center shadow-[0_0_32px_0_rgba(255,255,255,0.05)]">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Total Time Pissed</div>
          <div className="flex items-baseline justify-center gap-4 overflow-hidden">
            {stats.totalDuration === 0 ? (
              <span className="text-2xl text-slate-500">—</span>
            ) : (
              parseTotalMs(stats.totalDuration).map((seg, i) => (
                <TickSegment key={`${i}-${seg.value}`} value={seg.value} label={seg.label} />
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Total Pisses</div>
          <div className="text-3xl font-bold text-yellow-400">{stats.totalRuns}</div>
        </div>
        <div className={`rounded-2xl p-5 border ${stats.averageTime / 1000 >= 60 ? "bg-white border-slate-200" : "bg-white/5 border-white/10"}`}>
          <div className={`text-xs font-semibold uppercase tracking-wider mb-2 ${stats.averageTime / 1000 >= 60 ? "text-slate-500" : "text-slate-400"}`}>Average Time</div>
          <div className="text-3xl font-bold" style={{ color: getTimerColor(stats.averageTime / 1000) }}>{formatDuration(stats.averageTime)}</div>
        </div>
        {!omitMinMax && (
          <>
            <div className={`rounded-2xl p-5 border ${stats.shortestTime / 1000 >= 60 ? "bg-white border-slate-200" : "bg-white/5 border-white/10"}`}>
              <div className={`text-xs font-semibold uppercase tracking-wider mb-2 ${stats.shortestTime / 1000 >= 60 ? "text-slate-500" : "text-slate-400"}`}>Worst Piss</div>
              <div className="text-3xl font-bold" style={{ color: getTimerColor(stats.shortestTime / 1000) }}>{formatDuration(stats.shortestTime)}</div>
            </div>
            <div className={`rounded-2xl p-5 border ${stats.longestTime / 1000 >= 60 ? "bg-white border-slate-200" : "bg-white/5 border-white/10"}`}>
              <div className={`text-xs font-semibold uppercase tracking-wider mb-2 ${stats.longestTime / 1000 >= 60 ? "text-slate-500" : "text-slate-400"}`}>Best Piss</div>
              <div className="text-3xl font-bold" style={{ color: getTimerColor(stats.longestTime / 1000) }}>{formatDuration(stats.longestTime)}</div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
