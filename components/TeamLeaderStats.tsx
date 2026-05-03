"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { formatDuration, getUserAvatarColor } from "@/lib/utils"

interface Entry {
  userId: string
  name: string
  value: string
  subvalue?: string
}

interface Leaders {
  best: Entry | null
  worst: Entry | null
  consistent: Entry | null
  most24h: Entry | null
  fewest24h: Entry | null
}

function LeaderAvatar({ userId, name }: { userId: string; name: string }) {
  const color = getUserAvatarColor(userId)
  const initial = name.trim()[0]?.toUpperCase() || "?"
  return (
    <div className={`h-9 w-9 rounded-full ${color} text-white flex items-center justify-center text-sm font-semibold flex-shrink-0`}>
      {initial}
    </div>
  )
}

function LeaderCard({ title, entry, valueClass = "text-yellow-400" }: { title: string; entry: Entry; valueClass?: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
      <div className="text-xs text-slate-400 uppercase tracking-wider mb-3">{title}</div>
      <div className="flex items-center gap-3">
        <LeaderAvatar userId={entry.userId} name={entry.name} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white truncate">{entry.name}</div>
          {entry.subvalue && <div className="text-xs text-slate-400">{entry.subvalue}</div>}
        </div>
        <div className={`text-lg font-mono font-bold flex-shrink-0 ${valueClass}`}>
          {entry.value}
        </div>
      </div>
    </div>
  )
}

function normalizeTs(ts: string): number {
  const s = /[Zz]$|[+-]\d{2}:\d{2}$/.test(ts) ? ts : ts + "Z"
  return new Date(s).getTime()
}

export default function TeamLeaderStats({ teamId }: { teamId: string }) {
  const [leaders, setLeaders] = useState<Leaders | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const { data: rows } = await supabase
        .from("results")
        .select("user_id, user_display_name, duration_ms, created_at")
        .eq("team_id", teamId)
        .order("created_at", { ascending: true }) // ascending so last write = most recent name

      if (!rows || rows.length === 0) {
        setLoading(false)
        return
      }

      const cutoff = Date.now() - 24 * 60 * 60 * 1000
      const userMap = new Map<string, { name: string; durations: number[]; count24h: number }>()

      for (const row of rows) {
        if (!userMap.has(row.user_id)) {
          userMap.set(row.user_id, { name: "", durations: [], count24h: 0 })
        }
        const u = userMap.get(row.user_id)!
        // Always update name so the last (most recent) non-null value wins
        if (row.user_display_name) u.name = row.user_display_name
        u.durations.push(row.duration_ms)
        if (normalizeTs(row.created_at) >= cutoff) u.count24h++
      }

      // Fallback for users whose every record had null display_name
      for (const [, u] of userMap) {
        if (!u.name) u.name = "Member"
      }

      // Best / worst piss (single record, any user)
      let best: Entry | null = null
      let worst: Entry | null = null
      let bestDur = -Infinity
      let worstDur = Infinity

      for (const [userId, { name, durations }] of userMap) {
        const max = Math.max(...durations)
        const min = Math.min(...durations)
        if (max > bestDur) {
          bestDur = max
          best = { userId, name, value: `${formatDuration(max)}s` }
        }
        if (min < worstDur) {
          worstDur = min
          worst = { userId, name, value: `${formatDuration(min)}s` }
        }
      }

      // Most consistent: lowest coefficient of variation (min 3 entries)
      let bestCV = Infinity
      let consistent: Entry | null = null
      for (const [userId, { name, durations }] of userMap) {
        if (durations.length < 3) continue
        const mean = durations.reduce((a, b) => a + b, 0) / durations.length
        const variance = durations.reduce((a, b) => a + (b - mean) ** 2, 0) / durations.length
        const stdDev = Math.sqrt(variance)
        const cv = stdDev / mean
        if (cv < bestCV) {
          bestCV = cv
          consistent = {
            userId,
            name,
            value: `±${formatDuration(stdDev)}s`,
            subvalue: `avg ${formatDuration(mean)}s`,
          }
        }
      }

      // 24h leaders
      const sorted = Array.from(userMap.entries()).sort((a, b) => b[1].count24h - a[1].count24h)
      const [topId, topUser] = sorted[0]
      let most24h: Entry | null = null
      let fewest24h: Entry | null = null

      if (topUser.count24h > 0) {
        most24h = { userId: topId, name: topUser.name, value: topUser.count24h.toString() }
        if (sorted.length >= 2) {
          const [botId, botUser] = sorted[sorted.length - 1]
          if (botUser.count24h < topUser.count24h) {
            fewest24h = { userId: botId, name: botUser.name, value: botUser.count24h.toString() }
          }
        }
      }

      setLeaders({ best, worst, consistent, most24h, fewest24h })
      setLoading(false)
    }

    fetchData()
  }, [teamId])

  if (loading) {
    return (
      <div className="space-y-3 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 h-[76px] animate-pulse" />
        ))}
      </div>
    )
  }

  if (!leaders) return null

  return (
    <div className="space-y-3 mb-8">
      {leaders.best && (
        <LeaderCard title="Best Piss" entry={leaders.best} valueClass="text-green-400" />
      )}
      {leaders.worst && (
        <LeaderCard title="Worst Piss" entry={leaders.worst} valueClass="text-red-400" />
      )}
      {leaders.consistent && (
        <LeaderCard title="Most Consistent Pisser" entry={leaders.consistent} />
      )}
      {leaders.most24h && (
        <LeaderCard title="Most Pisses (24h)" entry={leaders.most24h} />
      )}
      {leaders.fewest24h && (
        <LeaderCard title="Fewest Pisses (24h)" entry={leaders.fewest24h} valueClass="text-red-400" />
      )}
    </div>
  )
}
