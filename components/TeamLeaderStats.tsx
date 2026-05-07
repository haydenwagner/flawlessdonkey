"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/components/AuthProvider"
import { getProfiles, type CachedProfile } from "@/lib/profileCache"
import { formatDuration, getUserAvatarColor } from "@/lib/utils"
import { getTimerColor } from "@/lib/timerColor"

interface LiveUser {
  id: string
  avatarUrl?: string | null
  avatarColor?: string | null
  displayName?: string | null
}

interface Entry {
  userId: string
  name: string
  value: string
  subvalue?: string
  durationMs?: number
}

interface Leaders {
  best: Entry | null
  worst: Entry | null
  consistent: Entry | null
  most24h: Entry | null
  fewest24h: Entry | null
}


function LeaderAvatar({ userId, name, avatarUrl, avatarColor }: { userId: string; name: string; avatarUrl?: string | null; avatarColor?: string | null }) {
  const color = avatarColor || getUserAvatarColor(userId)
  const initial = name.trim()[0]?.toUpperCase() || "?"
  return (
    <div className={`h-9 w-9 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-sm font-semibold ${avatarUrl ? "" : `${color} text-white`}`}>
      {avatarUrl ? (
        <img src={avatarUrl} alt={name} className="object-cover w-full h-full" />
      ) : (
        initial
      )}
    </div>
  )
}

function LeaderCard({ title, entry, valueClass = "text-yellow-400", profileMap, liveUser }: { title: string; entry: Entry; valueClass?: string; profileMap: Map<string, CachedProfile>; liveUser?: LiveUser }) {
  const profile = profileMap.get(entry.userId)
  const isMe = liveUser && entry.userId === liveUser.id
  const avatarUrl = isMe ? (liveUser.avatarUrl ?? profile?.avatar_url) : profile?.avatar_url
  const avatarColor = isMe ? (liveUser.avatarColor ?? profile?.avatar_color) : profile?.avatar_color
  const displayName = isMe
    ? (liveUser.displayName ?? profile?.display_name ?? entry.name)
    : (profile?.display_name ?? entry.name)
  const isDarkPurple = entry.durationMs !== undefined && entry.durationMs / 1000 >= 60
  const valueColor = entry.durationMs !== undefined ? getTimerColor(entry.durationMs / 1000) : undefined
  return (
    <div
      className="bg-white/5 border border-white/10 rounded-2xl p-4"
      style={isDarkPurple ? {
        backgroundImage: "linear-gradient(rgba(255,255,255,0.75), rgba(255,255,255,0.75))",
        backgroundPosition: "right 0",
        backgroundSize: "80px 100%",
        backgroundRepeat: "no-repeat",
      } : undefined}
    >
      <div className="text-xs text-slate-400 uppercase tracking-wider mb-3">{title}</div>
      <div className="flex items-center gap-3">
        <LeaderAvatar
          userId={entry.userId}
          name={displayName}
          avatarUrl={avatarUrl}
          avatarColor={avatarColor}
        />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white truncate">{displayName}</div>
          {entry.subvalue && <div className="text-xs text-slate-400">{entry.subvalue}</div>}
        </div>
        <div
          className={`text-lg font-mono font-bold flex-shrink-0 ${valueColor ? "" : valueClass}`}
          style={valueColor ? { color: valueColor } : undefined}
        >
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

export default function TeamLeaderStats({ teamId, refreshTrigger }: { teamId: string; refreshTrigger?: number }) {
  const { user } = useAuth()
  const liveUser: LiveUser | undefined = user ? {
    id: user.id,
    avatarUrl: user.user_metadata?.custom_avatar_url ?? null,
    avatarColor: user.user_metadata?.avatar_color ?? null,
    displayName: user.user_metadata?.display_name || user.user_metadata?.full_name || null,
  } : undefined
  const [leaders, setLeaders] = useState<Leaders | null>(null)
  const [profileMap, setProfileMap] = useState<Map<string, CachedProfile>>(new Map())
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
          best = { userId, name, value: `${formatDuration(max)}`, durationMs: max }
        }
        if (min < worstDur) {
          worstDur = min
          worst = { userId, name, value: `${formatDuration(min)}`, durationMs: min }
        }
      }

      // Most consistent: lowest coefficient of variation (min 2 entries)
      let bestCV = Infinity
      let consistent: Entry | null = null
      for (const [userId, { name, durations }] of userMap) {
        if (durations.length < 2) continue
        const mean = durations.reduce((a, b) => a + b, 0) / durations.length
        const variance = durations.reduce((a, b) => a + (b - mean) ** 2, 0) / durations.length
        const stdDev = Math.sqrt(variance)
        const cv = stdDev / mean
        if (cv < bestCV) {
          bestCV = cv
          consistent = {
            userId,
            name,
            value: `±${formatDuration(stdDev)}`,
            subvalue: `avg ${formatDuration(mean)}`,
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

      const userIds = Array.from(userMap.keys())
      const profiles = await getProfiles(userIds)
      setProfileMap(profiles)

      setLeaders({ best, worst, consistent, most24h, fewest24h })
      setLoading(false)
    }

    fetchData()
  }, [teamId, refreshTrigger])

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
        <LeaderCard title="Best Piss" entry={leaders.best} profileMap={profileMap} liveUser={liveUser} />
      )}
      {leaders.worst && (
        <LeaderCard title="Worst Piss" entry={leaders.worst} profileMap={profileMap} liveUser={liveUser} />
      )}
      {leaders.consistent && (
        <LeaderCard title="Most Consistent Pisser" entry={leaders.consistent} profileMap={profileMap} liveUser={liveUser} />
      )}
      {leaders.most24h && (
        <LeaderCard title="Most Pisses (24h)" entry={leaders.most24h} profileMap={profileMap} liveUser={liveUser} />
      )}
      {leaders.fewest24h && (
        <LeaderCard title="Fewest Pisses (24h)" entry={leaders.fewest24h} valueClass="text-red-400" profileMap={profileMap} liveUser={liveUser} />
      )}
    </div>
  )
}
