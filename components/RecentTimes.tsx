"use client"

import { useEffect, useState } from "react"
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
          setTimes(data || [])
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
      <div className="mt-8 bg-slate-700 rounded-lg p-6 shadow-xl">
        <h2 className="text-2xl font-semibold mb-4">Recent Piss</h2>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between bg-slate-600 rounded-lg p-4 animate-pulse">
              <div className="flex-1">
                <div className="h-4 bg-slate-500 rounded w-24 mb-2"></div>
                <div className="h-3 bg-slate-500 rounded w-32"></div>
              </div>
              <div className="h-6 bg-slate-500 rounded w-16"></div>
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
    <div className="mt-8 bg-slate-700 rounded-lg p-6 shadow-xl">
      <h2 className="text-2xl font-semibold mb-4">Recent Piss</h2>
      <div className="space-y-3">
        {times.map((result) => (
          <TimeEntryRow key={result.id} {...result} />
        ))}
      </div>
    </div>
  )
}
