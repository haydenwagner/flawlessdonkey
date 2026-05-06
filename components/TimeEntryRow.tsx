"use client"

import { useState, useEffect } from "react"
import { formatDuration, formatDateTime, getUserAvatarColor } from "@/lib/utils"
import { getTimerColor } from "@/lib/timerColor"

export interface TimeEntryRowProps {
  id: string
  created_at: string
  duration_ms: number
  userId?: string
  displayName?: string | null
  avatarColor?: string
  avatarUrl?: string | null
  isNew?: boolean
}

export default function TimeEntryRow({ created_at, duration_ms, userId, displayName, avatarColor, avatarUrl, isNew }: TimeEntryRowProps) {
  const [{ dateStr, timeStr }, setFormatted] = useState(() => formatDateTime(created_at))
  const [expanded, setExpanded] = useState(!isNew)
  const [visible, setVisible] = useState(!isNew)
  const [highlighted, setHighlighted] = useState(!!isNew)

  useEffect(() => {
    setFormatted(formatDateTime(created_at))
  }, [created_at])

  useEffect(() => {
    if (!isNew) {
      setExpanded(true)
      setVisible(true)
      setHighlighted(false)
      return
    }
    const t1 = setTimeout(() => { setExpanded(true); setVisible(true) }, 16)
    const t2 = setTimeout(() => setHighlighted(false), 2000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [isNew])

  const showAvatar = !!userId
  const resolvedColor = avatarColor || (userId ? getUserAvatarColor(userId) : "bg-slate-500")
  const initial = displayName?.trim()?.[0]?.toUpperCase() || "?"

  const isDarkPurple = duration_ms / 1000 >= 60

  return (
    // Outer grid container: animates height from 0 to auto, pushing items below it down
    <div
      style={{
        display: "grid",
        gridTemplateRows: expanded ? "1fr" : "0fr",
        transition: isNew ? "grid-template-rows 0.35s ease" : undefined,
      }}
    >
      <div style={{ overflow: "hidden", minHeight: 0 }}>
        <div
          style={{
            transition: "opacity 0.25s ease, background-color 0.7s ease, border-color 0.7s ease",
            backgroundImage: (!highlighted && isDarkPurple) ? "linear-gradient(rgba(255,255,255,0.75), rgba(255,255,255,0.75))" : undefined,
            backgroundPosition: (!highlighted && isDarkPurple) ? "right 0" : undefined,
            backgroundSize: (!highlighted && isDarkPurple) ? "80px 100%" : undefined,
            backgroundRepeat: (!highlighted && isDarkPurple) ? "no-repeat" : undefined,
          }}
          className={[
            "flex items-center gap-3 rounded-2xl p-4 border",
            highlighted ? "bg-yellow-400/30 border-yellow-400/50" : "bg-white/5 border-white/10",
            visible ? "opacity-100" : "opacity-0",
          ].join(" ")}
        >
          {showAvatar && (
            <div className={`h-9 w-9 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-sm font-semibold ${avatarUrl ? "" : `${resolvedColor} text-white`}`}>
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName || ""} className="object-cover w-full h-full" />
              ) : (
                initial
              )}
            </div>
          )}
          <div className="flex-1 min-w-0">
            {displayName && (
              <div className="text-xs font-medium text-slate-300 truncate mb-0.5">{displayName}</div>
            )}
            <div className="text-sm text-slate-300">{dateStr}</div>
            <div className="text-xs text-slate-400">{timeStr}</div>
          </div>
          <div
            style={{
              transition: "color 0.7s ease",
              color: highlighted ? "white" : getTimerColor(duration_ms / 1000),
            }}
            className="text-lg font-mono font-bold flex-shrink-0"
          >
            {formatDuration(duration_ms)}
          </div>
        </div>
      </div>
    </div>
  )
}
