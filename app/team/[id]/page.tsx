"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/components/AuthProvider"
import Nav from "@/components/Nav"
import UserStats from "@/components/UserStats"
import AllTimes from "@/components/AllTimes"
import TeamActivityChart from "@/components/TeamActivityChart"
import TeamLeaderStats from "@/components/TeamLeaderStats"
import type { Team } from "@/components/AuthProvider"

export default function TeamPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const teamId = params.id as string

  const [team, setTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [showCode, setShowCode] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!user) router.push("/login")
    }, 500)
    return () => clearTimeout(timer)
  }, [user, router])

  useEffect(() => {
    if (!user || !teamId) return

    const fetchTeam = async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("id, name, code, created_by")
        .eq("id", teamId)
        .single()

      if (error || !data) {
        router.push("/dashboard")
        return
      }

      setTeam(data as Team)
      setLoading(false)
    }

    fetchTeam()
  }, [user, teamId, router])

  const handleCopyCode = async () => {
    if (!team) return
    await navigator.clipboard.writeText(team.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading || !team) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8">
        <div className="max-w-2xl mx-auto">
          <Nav />
          <div className="animate-pulse">
            <div className="h-9 bg-slate-700 rounded w-48 mb-3"></div>
            <div className="h-12 bg-slate-700 rounded w-64 mb-8"></div>
            <div className="grid grid-cols-2 gap-4 mb-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-slate-700 rounded-lg p-6 h-24"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <Nav />

        <h1 className="text-3xl font-bold mb-3 break-words">{team.name}</h1>

        <div className="mb-8 min-h-8 flex items-center">
          {showCode ? (
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-2xl font-mono font-bold text-yellow-400 tracking-widest">
                {team.code}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="text-sm border border-white/20 hover:border-white/40 text-slate-300 hover:text-white px-3 py-1 rounded-lg transition"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
              <button
                type="button"
                onClick={() => setShowCode(false)}
                className="text-sm text-slate-400 hover:text-slate-300 transition underline underline-offset-2 decoration-slate-600"
              >
                Hide
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowCode(true)}
              className="text-sm text-slate-400 hover:text-slate-300 transition underline underline-offset-2 decoration-slate-600"
            >
              Show invite code
            </button>
          )}
        </div>

        <TeamActivityChart teamId={teamId} />
        <UserStats filter={{ column: "team_id", value: teamId }} omitMinMax />
        <TeamLeaderStats teamId={teamId} />

        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">All Piss</h2>
        <AllTimes filter={{ column: "team_id", value: teamId }} />
      </div>
    </div>
  )
}
