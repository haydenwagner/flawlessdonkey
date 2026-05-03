"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/components/AuthProvider"
import { getUserAvatarColor, AVATAR_COLORS } from "@/lib/utils"
import NavCard from "@/components/NavCard"
import Image from "next/image"

type DrawerView = "main" | "team-setup" | "create-team" | "join-team" | "settings"

function generateTeamCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function CogIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

export default function Nav() {
  const { user, hasBeenLoggedIn, team, teamLoading, refreshTeam } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [view, setView] = useState<DrawerView>("main")

  // create/join state
  const [teamName, setTeamName] = useState("")
  const [joinCode, setJoinCode] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // settings state
  const [settingsName, setSettingsName] = useState("")
  const [settingsColor, setSettingsColor] = useState("")
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsError, setSettingsError] = useState<string | null>(null)
  const [leavingTeam, setLeavingTeam] = useState(false)

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [drawerOpen])

  const avatarColor = user?.user_metadata?.avatar_color || (user?.id ? getUserAvatarColor(user.id) : "bg-slate-500")
  const displayName = user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.email || ""
  const initial = displayName.trim()?.[0]?.toUpperCase() || "?"

  const closeDrawer = () => {
    setDrawerOpen(false)
    setView("main")
    setTeamName("")
    setJoinCode("")
    setError(null)
    setSubmitting(false)
    setSettingsError(null)
    setLeavingTeam(false)
  }

  const openSettings = () => {
    setSettingsName(user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "")
    setSettingsColor(user?.user_metadata?.avatar_color || (user?.id ? getUserAvatarColor(user.id) : AVATAR_COLORS[0]))
    setSettingsError(null)
    setLeavingTeam(false)
    setView("settings")
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    closeDrawer()
  }

  const handleNavClick = (href: string) => {
    closeDrawer()
    if (pathname !== href) router.push(href)
  }

  const handleBack = () => {
    switch (view) {
      case "settings":
      case "team-setup":
        setView("main")
        break
      case "create-team":
        setView("team-setup")
        setTeamName("")
        setError(null)
        break
      case "join-team":
        setView("team-setup")
        setJoinCode("")
        setError(null)
        break
    }
  }

  const handleCreateTeam = async () => {
    if (!teamName.trim() || !user) return
    setSubmitting(true)
    setError(null)

    let attempts = 0
    while (attempts < 5) {
      const code = generateTeamCode()
      const { data: newTeam, error: teamError } = await supabase
        .from("teams")
        .insert({ name: teamName.trim(), code, created_by: user.id })
        .select()
        .single()

      if (teamError) {
        if (teamError.code === "23505") { attempts++; continue }
        setError("Failed to create team. Please try again.")
        setSubmitting(false)
        return
      }

      const { error: memberError } = await supabase
        .from("team_members")
        .insert({ team_id: newTeam.id, user_id: user.id })

      if (memberError) {
        setError("Team created but could not add you as a member. Please try again.")
        setSubmitting(false)
        return
      }

      await refreshTeam()
      closeDrawer()
      router.push(`/team/${newTeam.id}`)
      return
    }

    setError("Could not generate a unique team code. Please try again.")
    setSubmitting(false)
  }

  const handleJoinTeam = async () => {
    if (joinCode.length !== 6 || !user) return
    setSubmitting(true)
    setError(null)

    const { data: foundTeam, error: lookupError } = await supabase
      .from("teams")
      .select("id, name")
      .eq("code", joinCode)
      .maybeSingle()

    if (lookupError || !foundTeam) {
      setError("No team found with that code. Double-check and try again.")
      setSubmitting(false)
      return
    }

    const { error: joinError } = await supabase.rpc("join_or_rejoin_team", {
      p_team_id: foundTeam.id,
    })

    if (joinError) {
      setError("Failed to join team. Please try again.")
      setSubmitting(false)
      return
    }

    await refreshTeam()
    closeDrawer()
    router.push(`/team/${foundTeam.id}`)
  }

  const handleSaveSettings = async () => {
    if (!settingsName.trim()) return
    setSettingsSaving(true)
    setSettingsError(null)

    const { error } = await supabase.auth.updateUser({
      data: { display_name: settingsName.trim(), avatar_color: settingsColor },
    })

    if (error) {
      setSettingsError("Failed to save settings. Please try again.")
    } else {
      setView("main")
    }
    setSettingsSaving(false)
  }

  const handleLeaveTeam = async () => {
    if (!user || !team) return
    setSubmitting(true)

    const { error } = await supabase
      .from("team_members")
      .update({ left_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("team_id", team.id)
      .is("left_at", null)

    if (error) {
      setSettingsError("Failed to leave team. Please try again.")
      setSubmitting(false)
      setLeavingTeam(false)
      return
    }

    await refreshTeam()
    setLeavingTeam(false)
    setSubmitting(false)
    setView("main")
  }

  const renderView = () => {
    switch (view) {
      case "main":
        return (
          <div className="flex-1">
            <div className="mt-8 flex flex-col items-center gap-4">
              <div className={`h-28 w-28 rounded-full ${avatarColor} text-white flex items-center justify-center text-6xl font-bold shadow-lg`}>
                {initial}
              </div>
              <div className="text-base font-semibold text-white text-center">{displayName}</div>
              <div className="text-sm text-slate-400 text-center px-4">{user?.email}</div>
            </div>

            {/* Full-width stacked nav cards */}
            <div className="mt-8 space-y-3">
              <NavCard
                label="Timer"
                sublabel="Start a new piss"
                iconBgColor="bg-green-600"
                iconContent={
                  <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><polyline points="12,6 12,12 16,14" />
                  </svg>
                }
                onClick={() => handleNavClick("/")}
              />
              <NavCard
                label="Dashboard"
                sublabel="Your personal stats"
                iconBgColor="bg-amber-500"
                iconContent={
                  <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23,6 13.5,15.5 8.5,10.5 1,18" /><polyline points="17,6 23,6 23,12" />
                  </svg>
                }
                onClick={() => handleNavClick("/dashboard")}
              />
              {teamLoading ? (
                <div className="rounded-[32px] border border-white/10 bg-white/5 p-5 animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-3xl bg-slate-700 flex-shrink-0"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-slate-700 rounded w-24 mb-2"></div>
                      <div className="h-3 bg-slate-700 rounded w-16"></div>
                    </div>
                  </div>
                </div>
              ) : team ? (
                <NavCard
                  label={team.name}
                  sublabel="My Team"
                  iconBgColor="bg-violet-600"
                  iconContent={team.name[0].toUpperCase()}
                  onClick={() => handleNavClick(`/team/${team.id}`)}
                />
              ) : (
                <NavCard
                  label="Join or Create Team"
                  sublabel="Compete with friends"
                  iconBgColor="bg-slate-700"
                  iconContent="+"
                  onClick={() => setView("team-setup")}
                />
              )}
            </div>

            {/* Half-width grid layout (kept for reference — nice left-bar style)
            <div className="mt-12 grid grid-cols-2 gap-4">
              <button type="button" onClick={() => handleNavClick("/")} className="rounded-[32px] border border-white/10 bg-white/5 overflow-hidden text-left transition hover:bg-white/10 relative">
                <div className="absolute top-0 bottom-0 left-0 w-10 bg-green-600 rounded-l-[32px]"></div>
                <div className="relative px-2 py-3 flex items-center gap-4">
                  <svg viewBox="0 0 24 24" className="h-6 w-6 text-white flex-shrink-0 z-10 relative" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12,6 12,12 16,14" /></svg>
                  <div className="text-base font-semibold text-slate-100">Timer</div>
                </div>
              </button>
              <button type="button" onClick={() => handleNavClick("/dashboard")} className="rounded-[32px] border border-white/10 bg-white/5 overflow-hidden text-left transition hover:bg-white/10 relative">
                <div className="absolute top-0 bottom-0 left-0 w-10 bg-amber-500 rounded-l-[32px]"></div>
                <div className="relative px-2 py-3 flex items-center gap-4">
                  <svg viewBox="0 0 24 24" className="h-6 w-6 text-white flex-shrink-0 z-10 relative" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23,6 13.5,15.5 8.5,10.5 1,18" /><polyline points="17,6 23,6 23,12" /></svg>
                  <div className="text-base font-semibold text-slate-100">Dashboard</div>
                </div>
              </button>
            </div>
            */}
          </div>
        )

      case "team-setup":
        return (
          <div className="flex-1">
            <h2 className="text-xl font-bold mt-8 mb-1">Get Started</h2>
            <p className="text-sm text-slate-400 mb-8">Create a new team or join one with a code.</p>
            <div className="space-y-3">
              <NavCard
                label="Create a Team"
                sublabel="Start fresh, invite friends"
                iconBgColor="bg-violet-600"
                iconContent={
                  <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
                  </svg>
                }
                onClick={() => setView("create-team")}
              />
              <NavCard
                label="Join a Team"
                sublabel="Enter your 6-digit code"
                iconBgColor="bg-cyan-600"
                iconContent={
                  <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" />
                  </svg>
                }
                onClick={() => setView("join-team")}
              />
            </div>
          </div>
        )

      case "create-team":
        return (
          <div className="flex-1">
            <h2 className="text-xl font-bold mt-8 mb-1">Create a Team</h2>
            <p className="text-sm text-slate-400 mb-8">Give your team a name. A 6-digit code will be generated for others to join.</p>
            <div className="space-y-4">
              <input type="text" placeholder="Team name" value={teamName} onChange={(e) => setTeamName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleCreateTeam()} maxLength={50} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition" />
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button type="button" onClick={handleCreateTeam} disabled={!teamName.trim() || submitting} className="w-full rounded-xl bg-violet-600 px-4 py-3 text-base font-semibold text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition">
                {submitting ? "Creating..." : "Create Team"}
              </button>
            </div>
          </div>
        )

      case "join-team":
        return (
          <div className="flex-1">
            <h2 className="text-xl font-bold mt-8 mb-1">Join a Team</h2>
            <p className="text-sm text-slate-400 mb-8">Enter the 6-digit code from a team member.</p>
            <div className="space-y-4">
              <input type="text" inputMode="numeric" placeholder="000000" value={joinCode} onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, "").slice(0, 6))} maxLength={6} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-center text-2xl font-mono tracking-widest focus:outline-none focus:border-cyan-500 transition" />
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button type="button" onClick={handleJoinTeam} disabled={joinCode.length !== 6 || submitting} className="w-full rounded-xl bg-cyan-600 px-4 py-3 text-base font-semibold text-white hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition">
                {submitting ? "Joining..." : "Join Team"}
              </button>
            </div>
          </div>
        )

      case "settings":
        return (
          <div className="flex-1">
            <h2 className="text-xl font-bold mt-6 mb-6">Settings</h2>

            <div className="space-y-6">
              <div>
                <label className="text-sm text-slate-400 block mb-2">Display name</label>
                <input
                  type="text"
                  value={settingsName}
                  onChange={(e) => setSettingsName(e.target.value)}
                  maxLength={40}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400 block mb-3">Avatar color</label>
                <div className="flex flex-wrap gap-3">
                  {AVATAR_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSettingsColor(color)}
                      className={`h-10 w-10 rounded-full ${color} transition ${
                        settingsColor === color ? "ring-2 ring-white ring-offset-2 ring-offset-slate-900" : "opacity-70 hover:opacity-100"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {settingsError && <p className="text-red-400 text-sm">{settingsError}</p>}

              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={!settingsName.trim() || settingsSaving}
                className="w-full rounded-xl bg-violet-600 px-4 py-3 text-base font-semibold text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {settingsSaving ? "Saving..." : "Save"}
              </button>
            </div>

            <div className="mt-6 border-t border-white/10 pt-6">
              <div className="space-y-4">
                <button type="button" onClick={handleLogout} className="w-full rounded-xl bg-red-600 px-4 py-3 text-base font-semibold text-white hover:bg-red-700 transition">
                  Logout
                </button>

                {team && (
                  <div className="border-t border-white/10 pt-4">
                    {leavingTeam ? (
                      <div>
                        <p className="text-sm text-slate-300 mb-3">Leave <span className="font-semibold text-white">{team.name}</span>? Your past entries will stay on the team, but new ones won't.</p>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={handleLeaveTeam}
                            disabled={submitting}
                            className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-base font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition"
                          >
                            {submitting ? "Leaving..." : "Yes, leave"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setLeavingTeam(false)}
                            className="flex-1 rounded-xl bg-slate-700 px-4 py-3 text-base font-semibold text-white hover:bg-slate-600 transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setLeavingTeam(true)}
                        className="w-full rounded-xl border border-red-500/40 px-4 py-3 text-base font-semibold text-red-400 hover:bg-red-500/10 transition"
                      >
                        Leave {team.name}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <>
      <nav className="flex items-center justify-between mb-8">
        <button type="button" onClick={() => handleNavClick("/")} className="text-3xl font-bold hover:text-yellow-400 transition cursor-pointer">
          <Image src="/logo.png" alt="Site Logo" width={100} height={40} priority />
        </button>

        {(user || hasBeenLoggedIn) ? (
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className={`h-12 w-12 rounded-full ${avatarColor} text-white flex items-center justify-center text-lg font-semibold shadow-lg transition hover:opacity-90`}
            aria-label="Open account drawer"
          >
            {initial}
          </button>
        ) : (
          <Link href="/login" className="rounded-full bg-white hover:bg-slate-100 text-slate-900 px-5 py-2 text-sm font-semibold transition">
            Log in
          </Link>
        )}
      </nav>

      {drawerOpen && (
        <div className="fixed inset-0 z-40 flex">
          <button type="button" className="absolute inset-0 z-10 bg-black/40 backdrop-blur-sm" onClick={closeDrawer} aria-label="Close drawer" />

          <div className="ml-auto h-full w-full max-w-sm z-20 bg-slate-900 shadow-2xl border-l border-white/10 text-white flex flex-col">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0">
              {view !== "main" ? (
                <button type="button" onClick={handleBack} className="text-slate-400 hover:text-white transition text-sm">
                  ← Back
                </button>
              ) : (
                <button type="button" onClick={openSettings} className="text-slate-400 hover:text-white transition" aria-label="Settings">
                  <CogIcon />
                </button>
              )}
              <button type="button" onClick={closeDrawer} className="text-slate-400 hover:text-white" aria-label="Close drawer">
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-6">
              {renderView()}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
