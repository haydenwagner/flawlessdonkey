"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"

function normalizeTs(ts: string): number {
  // Ensure the string is parsed as UTC — same fix as formatDateTime in utils.ts
  const s = /[Zz]$|[+-]\d{2}:\d{2}$/.test(ts) ? ts : ts + "Z"
  return new Date(s).getTime()
}

export default function TeamActivityChart({ teamId, refreshTrigger }: { teamId: string; refreshTrigger?: number }) {
  const [buckets, setBuckets] = useState<number[]>(Array(24).fill(0))
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const { data } = await supabase
        .from("results")
        .select("created_at")
        .eq("team_id", teamId)
        .gte("created_at", cutoff)

      const counts = Array(24).fill(0)
      const now = Date.now()

      if (data) {
        for (const row of data) {
          const hoursAgo = (now - normalizeTs(row.created_at)) / 3_600_000
          if (hoursAgo < 0 || hoursAgo >= 24) continue // skip if parsed incorrectly
          counts[23 - Math.floor(hoursAgo)]++
        }
        setTotal(data.length)
      }

      setBuckets(counts)
      setLoading(false)
    }

    fetchData()
  }, [teamId, refreshTrigger])

  const maxCount = Math.max(...buckets, 1)

  if (loading) {
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
