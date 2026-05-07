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
import TeamSetupBanner from "@/components/TeamSetupBanner"
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
  const [teamRefreshTrigger, setTeamRefreshTrigger] = useState(0)
  const [liveRefreshTrigger, setLiveRefreshTrigger] = useState(0)

  useEffect(() => {
    if (!authLoading && !user) router.push("/login")
  }, [user, authLoading, router])

  useEffect(() => {
    const handler = () => setTeamRefreshTrigger((n) => n + 1)
    window.addEventListener("teamSettingsUpdated", handler)
    return () => window.removeEventListener("teamSettingsUpdated", handler)
  }, [])

  useEffect(() => {
    if (!teamId) return
    const channel = supabase
      .channel(`team-results-${teamId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "results", filter: `team_id=eq.${teamId}` }, () => {
        setLiveRefreshTrigger((n) => n + 1)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [teamId])

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
  }, [user, teamId, router, teamRefreshTrigger])

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

  const inviteCode = (
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
  )

  const bodyContent = (
    <>
      {userHasTeamEntries === false && (
        <GoToTimerCard
          label="No team piss yet"
          sublabel="Pisses before joining don't carry over. Head to the timer to record your first team piss."
        />
      )}
      <UserStats filter={{ column: "team_id", value: teamId }} omitMinMax refreshTrigger={liveRefreshTrigger} />
      <TeamLeaderStats teamId={teamId} refreshTrigger={liveRefreshTrigger} />
      <TeamActivityChart teamId={teamId} refreshTrigger={liveRefreshTrigger} />
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">All Pisses</h2>
      <AllTimes filter={{ column: "team_id", value: teamId }} refreshTrigger={liveRefreshTrigger} />
    </>
  )

  if (team.image_url) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        {/* Full-bleed hero — extends behind nav to the very top */}
        <div className="relative w-full h-72">
          <Image src={team.image_url} alt={team.name} fill className="object-cover" priority />
          {/* Top gradient keeps nav/avatar readable */}
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/70 to-transparent pointer-events-none" />
          {/* Bottom gradient keeps team name readable */}
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-slate-900 to-transparent pointer-events-none" />
          {/* Nav overlaid at the top */}
          <div className="absolute inset-x-0 top-0 px-8 pt-8">
            <div className="max-w-2xl mx-auto">
              <Nav />
            </div>
          </div>
          {/* Team name and invite code at the bottom */}
          <div className="absolute inset-x-0 bottom-0 px-8 pb-5">
            <div className="max-w-2xl mx-auto">
              <h1 className="text-3xl font-bold break-words mb-2">{team.name}</h1>
              {inviteCode}
            </div>
          </div>
        </div>

        <div className="bg-slate-900 w-full">
          <div className="max-w-2xl mx-auto px-8 pb-8 pt-6">
            {bodyContent}
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
        <div className="mb-8">{inviteCode}</div>

        {user?.id === team.created_by && (
          <TeamSetupBanner />
        )}

        {bodyContent}
      </div>
    </div>
  )
}
