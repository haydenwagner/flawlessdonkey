"use client"

import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/components/AuthProvider"
import TimeEntryRow from "@/components/TimeEntryRow"

interface TimeResult {
  id: string
  created_at: string
  duration_ms: number
}

export default function RecentTimes({ refreshTrigger }: { refreshTrigger?: number }) {
  const { user } = useAuth()
  const [times, setTimes] = useState<TimeResult[]>([])
  const [loading, setLoading] = useState(true)
  const [newId, setNewId] = useState<string | null>(null)
  const prevFirstIdRef = useRef<string | null>(null)
  const hasLoadedRef = useRef(false)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const fetchRecentTimes = async () => {
      try {
        const { data, error } = await supabase
          .from("results")
          .select("id, created_at, duration_ms")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5)

        if (error) {
          console.error("[RecentTimes] Error fetching results:", error)
          setTimes([])
        } else {
          const results = data || []
          setTimes(results)

          const firstId = results[0]?.id ?? null
          if (hasLoadedRef.current && firstId && firstId !== prevFirstIdRef.current) {
            setNewId(firstId)
          } else {
            setNewId(null)
          }
          prevFirstIdRef.current = firstId
          hasLoadedRef.current = true
        }
      } catch (error) {
        console.error("[RecentTimes] Unexpected error:", error)
        setTimes([])
      } finally {
        setLoading(false)
      }
    }

    fetchRecentTimes()
  }, [user, refreshTrigger])

  if (loading) {
    return (
      <div className="mt-4">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Recent Pisses</h2>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl p-4 animate-pulse">
              <div className="flex-1">
                <div className="h-4 bg-slate-600 rounded w-24 mb-2"></div>
                <div className="h-3 bg-slate-600 rounded w-32"></div>
              </div>
              <div className="h-6 bg-slate-600 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (times.length === 0) {
    return <div className="text-slate-400 mt-8">No times saved yet.</div>
  }

  return (
    <div className="mt-4">
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Recent Pisses</h2>
      <div className="space-y-3">
        {times.map((result) => (
          <TimeEntryRow
            key={result.id}
            {...result}
            isNew={result.id === newId}
          />
        ))}
      </div>
    </div>
  )
}
