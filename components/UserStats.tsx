"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/hooks/useAuth"

interface Stats {
  totalRuns: number
  averageTime: number
  bestTime: number
  worstTime: number
}

export default function UserStats() {
  const { user } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const fetchStats = async () => {
      try {
        const { data, error } = await supabase
          .from("results")
          .select("duration_ms")
          .eq("user_id", user.id)

        if (error) {
          console.error("[UserStats] Error fetching stats:", error)
          setStats(null)
          return
        }

        if (!data || data.length === 0) {
          setStats({
            totalRuns: 0,
            averageTime: 0,
            bestTime: 0,
            worstTime: 0,
          })
          return
        }

        const durations = data.map((r) => r.duration_ms)
        const totalRuns = durations.length
        const averageTime = durations.reduce((a, b) => a + b, 0) / totalRuns
        const bestTime = Math.min(...durations)
        const worstTime = Math.max(...durations)

        setStats({
          totalRuns,
          averageTime,
          bestTime,
          worstTime,
        })
      } catch (error) {
        console.error("[UserStats] Unexpected error:", error)
        setStats(null)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [user])

  const formatTime = (ms: number) => {
    return (ms / 1000).toFixed(1)
  }

  if (loading) {
    return <div className="text-slate-400">Loading stats...</div>
  }

  if (!stats) {
    return <div className="text-slate-400">Unable to load stats.</div>
  }

  return (
    <div className="grid grid-cols-2 gap-4 mb-8">
      <div className="bg-slate-700 rounded-lg p-6 shadow-xl">
        <div className="text-sm text-slate-400 mb-2">Total Runs</div>
        <div className="text-3xl font-bold text-yellow-400">{stats.totalRuns}</div>
      </div>
      <div className="bg-slate-700 rounded-lg p-6 shadow-xl">
        <div className="text-sm text-slate-400 mb-2">Average Time</div>
        <div className="text-3xl font-bold text-yellow-400">{formatTime(stats.averageTime)} s</div>
      </div>
      <div className="bg-slate-700 rounded-lg p-6 shadow-xl">
        <div className="text-sm text-slate-400 mb-2">Best Time</div>
        <div className="text-3xl font-bold text-green-400">{formatTime(stats.bestTime)} s</div>
      </div>
      <div className="bg-slate-700 rounded-lg p-6 shadow-xl">
        <div className="text-sm text-slate-400 mb-2">Worst Time</div>
        <div className="text-3xl font-bold text-red-400">{formatTime(stats.worstTime)} s</div>
      </div>
    </div>
  )
}
