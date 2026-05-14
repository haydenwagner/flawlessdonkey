"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import useSWR, { useSWRConfig } from "swr"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/components/AuthProvider"
import UserStats from "@/components/UserStats"
import AllTimes from "@/components/AllTimes"
import TeamActivityChart from "@/components/TeamActivityChart"
import TeamLeaderStats from "@/components/TeamLeaderStats"
import GoToTimerCard from "@/components/GoToTimerCard"
import TeamSetupBanner from "@/components/TeamSetupBanner"
import type { Team } from "@/components/AuthProvider"
import type { Stats } from "@/components/UserStats"

async function fetchTeam(teamId: string): Promise<Team> {
  const { data, error } = await supabase
    .from("teams")
    .select("id, name, code, created_by, image_url, description")
    .eq("id", teamId)
    .single()
  if (error) throw error
  return data as Team
}

async function fetchUserHasTeamEntries(teamId: string, userId: string): Promise<boolean> {
  const { count } = await supabase
    .from("results")
    .select("id", { count: "exact", head: true })
    .eq("team_id", teamId)
    .eq("user_id", userId)
  return (count ?? 0) > 0
}

export default function TeamPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const teamId = params.id as string
  const { mutate } = useSWRConfig()

  const [pageError, setPageError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showCode, setShowCode] = useState(false)

  const { data: team, error: fetchError } = useSWR(
    user && teamId ? ["team", teamId] : null,
    ([, id]) => fetchTeam(id)
  )

  const { data: userHasTeamEntries } = useSWR(
    user && teamId ? ["userHasTeamEntries", teamId, user.id] : null,
    ([, tid, uid]) => fetchUserHasTeamEntries(tid, uid)
  )

  useEffect(() => {
    if (!authLoading && !user) router.push("/login")
  }, [user, authLoading, router])

  useEffect(() => {
    if (!fetchError) return
    const code = (fetchError as { code?: string }).code
    if (code === "PGRST116") router.push("/dashboard")
    else setPageError("Failed to load team. Please try again.")
  }, [fetchError, router])

  useEffect(() => {
    const handler = () => mutate(["team", teamId])
    window.addEventListener("teamSettingsUpdated", handler)
    return () => window.removeEventListener("teamSettingsUpdated", handler)
  }, [teamId, mutate])

  useEffect(() => {
    if (!teamId) return
    const channel = supabase
      .channel(`team-results-${teamId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "results", filter: `team_id=eq.${teamId}` }, (payload) => {
        const durationMs = (payload.new as { duration_ms?: number }).duration_ms ?? 0
        mutate(["userStats", "team_id", teamId], (prev: Stats | undefined) =>
          prev ? { ...prev, totalDuration: prev.totalDuration + durationMs, totalRuns: prev.totalRuns + 1 } : undefined,
          { revalidate: false }
        )
        mutate(["allTimes", "team_id", teamId])
        mutate(["leaders", teamId])
        mutate(["activity", "team_id", teamId])
        if (user) mutate(["userHasTeamEntries", teamId, user.id])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [teamId, user, mutate])

  const handleCopyCode = async () => {
    if (!team) return
    await navigator.clipboard.writeText(team.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (pageError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white px-8 pt-28 pb-8">
        <div className="max-w-2xl mx-auto">
          <p className="text-red-400">{pageError}</p>
        </div>
      </div>
    )
  }

  const inviteCode = team ? (
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
  ) : null

  const bodyContent = (
    <>
      {userHasTeamEntries === false && (
        <GoToTimerCard
          label="No team piss yet"
          sublabel="Pisses before joining don't carry over. Head to the timer to record your first team piss."
        />
      )}
      <UserStats filter={{ column: "team_id", value: teamId }} omitMinMax />
      <TeamLeaderStats teamId={teamId} />
      <TeamActivityChart filter={{ column: "team_id", value: teamId }} />
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">All Pisses</h2>
      <AllTimes filter={{ column: "team_id", value: teamId }} />
    </>
  )

  if (team?.image_url) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="relative w-full h-72">
          <Image src={team.image_url} alt={team.name} fill className="object-cover" priority />
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/70 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-slate-900 to-transparent pointer-events-none" />
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white px-8 pt-28 pb-8">
      <div className="max-w-2xl mx-auto">
        {team ? (
          <>
            <h1 className="text-3xl font-bold mb-3 break-words">{team.name}</h1>
            <div className="mb-8">{inviteCode}</div>
            {user?.id === team.created_by && <TeamSetupBanner />}
          </>
        ) : (
          <div className="animate-pulse mb-8">
            <div className="h-9 bg-slate-700 rounded w-48 mb-3"></div>
            <div className="h-6 bg-slate-700 rounded w-32"></div>
          </div>
        )}

        {bodyContent}
      </div>
    </div>
  )
}
