"use client"

import useSWR from "swr"
import { supabase } from "@/lib/supabaseClient"

function normalizeTs(ts: string): number {
  const s = /[Zz]$|[+-]\d{2}:\d{2}$/.test(ts) ? ts : ts + "Z"
  return new Date(s).getTime()
}

async function fetchActivity(column: string, value: string): Promise<{ buckets: number[]; total: number }> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data } = await supabase
    .from("results")
    .select("created_at")
    .eq(column, value)
    .gte("created_at", cutoff)

  const counts = Array(24).fill(0)
  const now = Date.now()
  let total = 0

  if (data) {
    for (const row of data) {
      const hoursAgo = (now - normalizeTs(row.created_at)) / 3_600_000
      if (hoursAgo < 0 || hoursAgo >= 24) continue
      counts[23 - Math.floor(hoursAgo)]++
    }
    total = data.length
  }

  return { buckets: counts, total }
}

interface ActivityChartProps {
  filter: { column: "team_id" | "user_id"; value: string }
}

export default function TeamActivityChart({ filter }: ActivityChartProps) {
  const { data, isLoading } = useSWR(
    filter.value ? ["activity", filter.column, filter.value] : null,
    ([, col, val]) => fetchActivity(col, val)
  )

  const buckets = data?.buckets ?? Array(24).fill(0)
  const total = data?.total ?? 0
  const maxCount = Math.max(...buckets, 1)

  if (isLoading) {
    return (
      <div className="mb-8">
        <div className="flex items-baseline justify-between mb-3">
          <div className="h-4 bg-slate-700 rounded w-32 animate-pulse" />
          <div className="h-3 bg-slate-700 rounded w-16 animate-pulse" />
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 h-28 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="mb-8">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Last 24 Hours</h2>
        <span className="text-sm text-slate-500">{total} {total === 1 ? "piss" : "pisses"}</span>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
        {total === 0 ? (
          <div className="h-16 flex items-center justify-center text-slate-500 text-sm">
            No pisses recorded in the last 24 hours
          </div>
        ) : (
          <div className="flex items-end gap-[2px] h-16">
            {buckets.map((count, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-[2px]"
                style={{
                  height: count > 0 ? `${Math.max(12, Math.round((count / maxCount) * 100))}%` : "2px",
                  backgroundColor: count > 0
                    ? "rgb(250 204 21 / 0.75)"
                    : "rgb(255 255 255 / 0.05)",
                }}
              />
            ))}
          </div>
        )}
        <div className="grid grid-cols-3 mt-2">
          <span className="text-xs text-slate-500 text-left">24h ago</span>
          <span className="text-xs text-slate-500 text-center">12h ago</span>
          <span className="text-xs text-slate-500 text-right">Now</span>
        </div>
      </div>
    </div>
  )
}
