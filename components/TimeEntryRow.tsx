"use client"

import { formatDuration, formatDateTime, getUserAvatarColor } from "@/lib/utils"

export interface TimeEntryRowProps {
  id: string
  created_at: string
  duration_ms: number
  userId?: string
  displayName?: string | null
  avatarColor?: string
}

export default function TimeEntryRow({ id, created_at, duration_ms, userId, displayName, avatarColor }: TimeEntryRowProps) {
  const { dateStr, timeStr } = formatDateTime(created_at)
  const showAvatar = !!userId
  const resolvedColor = avatarColor || (userId ? getUserAvatarColor(userId) : "bg-slate-500")
  const initial = displayName?.trim()?.[0]?.toUpperCase() || "?"

  return (
    <div key={id} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-4">
      {showAvatar && (
        <div className={`h-9 w-9 rounded-full ${resolvedColor} text-white flex items-center justify-center text-sm font-semibold flex-shrink-0`}>
          {initial}
        </div>
      )}
      <div className="flex-1 min-w-0">
        {displayName && (
          <div className="text-xs font-medium text-slate-300 truncate mb-0.5">{displayName}</div>
        )}
        <div className="text-sm text-slate-300">{dateStr}</div>
        <div className="text-xs text-slate-400">{timeStr}</div>
      </div>
      <div className="text-lg font-mono font-bold text-yellow-400 flex-shrink-0">
        {formatDuration(duration_ms)} s
      </div>
    </div>
  )
}
