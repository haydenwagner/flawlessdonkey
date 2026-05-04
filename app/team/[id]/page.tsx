"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/components/AuthProvider"
import Nav from "@/components/Nav"
import UserStats from "@/components/UserStats"
import AllTimes from "@/components/AllTimes"
import TeamActivityChart from "@/components/TeamActivityChart"
import TeamLeaderStats from "@/components/TeamLeaderStats"
import GoToTimerCard from "@/components/GoToTimerCard"
import type { Team } from "@/components/AuthProvider"

export default function TeamPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const teamId = params.id as string

  const [team, setTeam] = useState<Team | null>(null)
  const [pageLoading, setPageLoading] = useState(true)
  const [pageError, setPageError] = useState<string | null>(null)
  const [userHasTeamEntries, setUserHasTeamEntries] = useState<boolean | null>(null)
  const [copied, setCopied] = useState(false)
  const [showCode, setShowCode] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) router.push("/login")
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user || !teamId) return

    const fetchTeam = async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("id, name, code, created_by, image_url, description")
        .eq("id", teamId)
        .single()

      if (error) {
        if (error.code === "PGRST116") {
          router.push("/dashboard")
        } else {
          console.error("[TeamPage] Failed to fetch team:", error)
          setPageError("Failed to load team. Please try again.")
          setPageLoading(false)
        }
        return
      }

      if (!data) {
        router.push("/dashboard")
        return
      }

      setTeam(data as Team)
      setPageLoading(false)
    }

    fetchTeam()
  }, [user, teamId, router])

  useEffect(() => {
    if (!user || !teamId) return
    supabase
      .from("results")
      .select("id", { count: "exact", head: true })
      .eq("team_id", teamId)
      .eq("user_id", user.id)
      .then(({ count }) => setUserHasTeamEntries((count ?? 0) > 0))
  }, [user, teamId])

  const handleCopyCode = async () => {
    if (!team) return
    await navigator.clipboard.writeText(team.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (pageError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8">
        <div className="max-w-2xl mx-auto">
          <Nav />
          <p className="text-red-400 mt-8">{pageError}</p>
        </div>
      </div>
    )
  }

  if (pageLoading || !team) {
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

        {team.image_url ? (
          <div className="relative w-full h-48 rounded-2xl overflow-hidden mb-8">
            <Image src={team.image_url} alt={team.name} fill className="object-cover" priority />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <h1 className="text-3xl font-bold break-words mb-2">{team.name}</h1>
              <div className="min-h-8 flex items-center">
                {showCode ? (
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-2xl font-mono font-bold text-yellow-400 tracking-widest">{team.code}</span>
                    <button type="button" onClick={handleCopyCode} className="text-sm border border-white/20 hover:border-white/40 text-slate-300 hover:text-white px-3 py-1 rounded-lg transition">
                      {copied ? "Copied!" : "Copy"}
                    </button>
                    <button type="button" onClick={() => setShowCode(false)} className="text-sm text-slate-400 hover:text-slate-300 transition underline underline-offset-2 decoration-slate-600">
                      Hide
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setShowCode(true)} className="text-sm text-slate-400 hover:text-slate-300 transition underline underline-offset-2 decoration-slate-600">
                    Show invite code
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-bold mb-3 break-words">{team.name}</h1>
            <div className="mb-8 min-h-8 flex items-center">
              {showCode ? (
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-2xl font-mono font-bold text-yellow-400 tracking-widest">{team.code}</span>
                  <button type="button" onClick={handleCopyCode} className="text-sm border border-white/20 hover:border-white/40 text-slate-300 hover:text-white px-3 py-1 rounded-lg transition">
                    {copied ? "Copied!" : "Copy"}
                  </button>
                  <button type="button" onClick={() => setShowCode(false)} className="text-sm text-slate-400 hover:text-slate-300 transition underline underline-offset-2 decoration-slate-600">
                    Hide
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => setShowCode(true)} className="text-sm text-slate-400 hover:text-slate-300 transition underline underline-offset-2 decoration-slate-600">
                  Show invite code
                </button>
              )}
            </div>
          </>
        )}

        {userHasTeamEntries === false && (
          <GoToTimerCard
            label="No team piss yet"
            sublabel="Pisses before joining don't carry over. Head to the timer to record your first team piss."
          />
        )}

        <TeamActivityChart teamId={teamId} />
        <UserStats filter={{ column: "team_id", value: teamId }} omitMinMax />
        <TeamLeaderStats teamId={teamId} />

        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">All Piss</h2>
        <AllTimes filter={{ column: "team_id", value: teamId }} />
      </div>
    </div>
  )
}
