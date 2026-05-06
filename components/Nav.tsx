"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import Image from "next/image"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/components/AuthProvider"
import { getUserAvatarColor, AVATAR_COLORS } from "@/lib/utils"
import { uploadImage } from "@/lib/uploadImage"
import { setCachedProfile } from "@/lib/profileCache"
import NavCard from "@/components/NavCard"

type DrawerView = "main" | "team-setup" | "create-team" | "join-team" | "settings" | "team-settings"

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


function ImagePlaceholderIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8 text-slate-500" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  )
}

export default function Nav() {
  const { user, loading: authLoading, hasBeenLoggedIn, team, teamLoading, refreshTeam } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [view, setView] = useState<DrawerView>("main")

  // create/join state
  const [teamName, setTeamName] = useState("")
  const [joinCode, setJoinCode] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // user settings state
  const [settingsName, setSettingsName] = useState("")
  const [settingsColor, setSettingsColor] = useState("")
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsError, setSettingsError] = useState<string | null>(null)
  const [showLeaveTeamModal, setShowLeaveTeamModal] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [clearAvatar, setClearAvatar] = useState(false)
  const [originalSettingsName, setOriginalSettingsName] = useState("")
  const [originalSettingsColor, setOriginalSettingsColor] = useState("")
  const [showDiscardPrompt, setShowDiscardPrompt] = useState(false)
  const [discardTarget, setDiscardTarget] = useState<"main" | "settings" | "close">("main")
  const [teamSettingsOrigin, setTeamSettingsOrigin] = useState<"settings" | "team-page">("settings")
  const [pendingOpenTeamSettings, setPendingOpenTeamSettings] = useState(false)

  // team settings state
  const [teamSettingsName, setTeamSettingsName] = useState("")
  const [originalTeamSettingsName, setOriginalTeamSettingsName] = useState("")
  const [teamDescription, setTeamDescription] = useState("")
  const [originalTeamDescription, setOriginalTeamDescription] = useState("")
  const [teamImageFile, setTeamImageFile] = useState<File | null>(null)
  const [teamImagePreview, setTeamImagePreview] = useState<string | null>(null)
  const [teamSettingsSaving, setTeamSettingsSaving] = useState(false)
  const [teamSettingsError, setTeamSettingsError] = useState<string | null>(null)

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [drawerOpen])

  useEffect(() => {
    const handler = () => setPendingOpenTeamSettings(true)
    window.addEventListener("openNavTeamSettings", handler)
    return () => window.removeEventListener("openNavTeamSettings", handler)
  }, [])

  useEffect(() => {
    if (!pendingOpenTeamSettings) return
    setPendingOpenTeamSettings(false)
    setTeamSettingsOrigin("team-page")
    setDrawerOpen(true)
    openTeamSettings()
  }, [pendingOpenTeamSettings, team])

  const avatarColor = user?.user_metadata?.avatar_color || (user?.id ? getUserAvatarColor(user.id) : "bg-slate-500")
  const avatarUrl = (user?.user_metadata?.custom_avatar_url as string | null) ?? null
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
    setShowLeaveTeamModal(false)
    setAvatarFile(null)
    setAvatarPreview(null)
    setClearAvatar(false)
    setTeamImageFile(null)
    setTeamImagePreview(null)
    setTeamSettingsError(null)
    setShowDiscardPrompt(false)
  }

  const openSettings = () => {
    const name = user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || ""
    const color = user?.user_metadata?.avatar_color || (user?.id ? getUserAvatarColor(user.id) : AVATAR_COLORS[0])
    setSettingsName(name)
    setOriginalSettingsName(name)
    setSettingsColor(color)
    setOriginalSettingsColor(color)
    setAvatarFile(null)
    setAvatarPreview(avatarUrl)
    setClearAvatar(false)
    setSettingsError(null)
    setShowDiscardPrompt(false)
    setView("settings")
  }

  const openTeamSettings = () => {
    setTeamSettingsName(team?.name || "")
    setOriginalTeamSettingsName(team?.name || "")
    setTeamDescription(team?.description || "")
    setOriginalTeamDescription(team?.description || "")
    setTeamImageFile(null)
    setTeamImagePreview(team?.image_url || null)
    setTeamSettingsError(null)
    setView("team-settings")
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
      case "team-setup":
        setView("main")
        break
      case "settings": {
        const hasChanges = settingsName !== originalSettingsName || settingsColor !== originalSettingsColor || avatarFile !== null || (clearAvatar && avatarUrl !== null)
        if (hasChanges) { setDiscardTarget("main"); setShowDiscardPrompt(true); return }
        setView("main")
        break
      }
      case "team-settings": {
        const hasTeamChanges = teamImageFile !== null || teamSettingsName.trim() !== originalTeamSettingsName.trim() || teamDescription.trim() !== originalTeamDescription.trim()
        const teamDiscardTarget = teamSettingsOrigin === "team-page" ? "close" : "settings"
        if (hasTeamChanges) { setDiscardTarget(teamDiscardTarget); setShowDiscardPrompt(true); return }
        if (teamSettingsOrigin === "team-page") closeDrawer()
        else openSettings()
        break
      }
      case "create-team":
        setView("team-setup")
        setTeamName("")
        setTeamDescription("")
        setTeamImageFile(null)
        setTeamImagePreview(null)
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

      if (teamImageFile || teamDescription.trim()) {
        let imageUrl: string | null = null
        if (teamImageFile) {
          imageUrl = await uploadImage("team-images", newTeam.id, teamImageFile)
        }
        await supabase.from("teams").update({
          image_url: imageUrl,
          description: teamDescription.trim() || null,
        }).eq("id", newTeam.id)
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

    try {
      let newAvatarUrl: string | null = avatarUrl

      if (clearAvatar) {
        newAvatarUrl = null
      } else if (avatarFile && user) {
        const uploaded = await uploadImage("avatars", user.id, avatarFile)
        if (!uploaded) {
          setSettingsError("Failed to upload avatar. Please try again.")
          return
        }
        newAvatarUrl = uploaded
      }

      const { error } = await supabase.auth.updateUser({
        data: {
          display_name: settingsName.trim(),
          avatar_color: settingsColor,
          custom_avatar_url: newAvatarUrl,
        },
      })

      if (error) {
        setSettingsError("Failed to save settings. Please try again.")
      } else {
        const profileData = {
          display_name: settingsName.trim(),
          avatar_color: settingsColor,
          avatar_url: newAvatarUrl,
        }
        const { error: profileError } = await supabase.from("profiles").upsert({
          id: user!.id,
          ...profileData,
          updated_at: new Date().toISOString(),
        }, { onConflict: "id" })
        if (profileError) console.error("[Nav] Profile upsert failed:", profileError)
        setCachedProfile(user!.id, profileData)
        setAvatarFile(null)
        setView("main")
      }
    } finally {
      setSettingsSaving(false)
    }
  }

  const handleSaveTeamSettings = async () => {
    if (!team || !user) return
    setTeamSettingsSaving(true)
    setTeamSettingsError(null)

    try {
      let imageUrl = team.image_url

      if (teamImageFile) {
        const uploaded = await uploadImage("team-images", team.id, teamImageFile)
        if (!uploaded) {
          setTeamSettingsError("Failed to upload image. Please try again.")
          return
        }
        imageUrl = uploaded
      }

      const { error } = await supabase
        .from("teams")
        .update({
          name: teamSettingsName.trim(),
          image_url: imageUrl,
          description: teamDescription.trim() || null,
        })
        .eq("id", team.id)

      if (error) {
        setTeamSettingsError("Failed to save team settings. Please try again.")
        return
      }

      await refreshTeam()
      window.dispatchEvent(new CustomEvent("teamSettingsUpdated"))
      closeDrawer()
    } finally {
      setTeamSettingsSaving(false)
    }
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
      setShowLeaveTeamModal(false)
      return
    }

    await refreshTeam()
    setShowLeaveTeamModal(false)
    setSubmitting(false)
    setView("main")
  }

  const renderView = () => {
    switch (view) {
      case "main":
        return (
          <div className="flex-1">
            <div className="mt-8 flex flex-col items-center gap-4">
              {avatarUrl ? (
                <div className="h-28 w-28 rounded-full overflow-hidden shadow-lg">
                  <img src={avatarUrl} alt="Avatar" className="object-cover w-full h-full" />
                </div>
              ) : (
                <div className={`h-28 w-28 rounded-full ${avatarColor} text-white flex items-center justify-center text-6xl font-bold shadow-lg`}>
                  {initial}
                </div>
              )}
              <div className="text-base font-semibold text-white text-center">{displayName}</div>
            </div>

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
                  sublabel={team.description || "My team"}
                  iconBgColor="bg-violet-600"
                  iconImageUrl={team.image_url}
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
                onClick={() => { setTeamDescription(""); setTeamImageFile(null); setTeamImagePreview(null); setView("create-team") }}
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

              <div>
                <label className="text-sm text-slate-400 block mb-2">Team image <span className="text-slate-600">— optional</span></label>
                <div className="relative rounded-xl overflow-hidden bg-white/5 border border-white/10 aspect-video flex items-center justify-center group cursor-pointer">
                  {teamImagePreview ? (
                    <img src={teamImagePreview} alt="Team image preview" className="absolute inset-0 object-cover w-full h-full" />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <ImagePlaceholderIcon />
                      <span className="text-sm text-slate-500">Upload an image</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                    <span className="text-white text-sm font-medium">{teamImagePreview ? "Change image" : "Upload image"}</span>
                  </div>
                  <label className="absolute inset-0 cursor-pointer">
                    <input type="file" accept="image/*" className="sr-only" onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      setTeamImageFile(file)
                      setTeamImagePreview(URL.createObjectURL(file))
                    }} />
                  </label>
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-400 block mb-2">Description <span className="text-slate-600">— optional</span></label>
                <input type="text" value={teamDescription} onChange={(e) => setTeamDescription(e.target.value)} maxLength={80} placeholder="Add a team tagline..." className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition" />
              </div>

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
            <h2 className="text-xl font-bold mt-6 mb-1">Settings</h2>
            <p className="text-sm text-slate-500 mb-6">{user?.email}</p>

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
                <label className="text-sm text-slate-400 block mb-3">Avatar</label>
                <div className="flex items-center gap-4">
                  <div className={`h-14 w-14 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-xl font-bold text-white ${!avatarPreview ? settingsColor : ""}`}>
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar preview" className="object-cover w-full h-full" />
                    ) : (
                      initial
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {AVATAR_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => {
                          setSettingsColor(color)
                          setAvatarFile(null)
                          setAvatarPreview(null)
                          setClearAvatar(true)
                        }}
                        className={`h-8 w-8 rounded-full ${color} transition ${
                          settingsColor === color && !avatarPreview ? "ring-2 ring-white ring-offset-1 ring-offset-slate-900" : "opacity-70 hover:opacity-100"
                        }`}
                      />
                    ))}
                    <label className="h-8 w-8 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 flex items-center justify-center cursor-pointer transition">
                      <svg viewBox="0 0 24 24" className="h-4 w-4 text-white/70" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                        <circle cx="12" cy="13" r="4" />
                      </svg>
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          setAvatarFile(file)
                          setAvatarPreview(URL.createObjectURL(file))
                          setClearAvatar(false)
                        }}
                      />
                    </label>
                  </div>
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

            <div className="mt-6 border-t border-white/10 pt-6 space-y-4">
              {team && team.created_by === user?.id && (
                <button
                  type="button"
                  onClick={() => { setTeamSettingsOrigin("settings"); openTeamSettings() }}
                  className="w-full rounded-xl border border-white/10 px-4 py-3 text-base font-semibold text-slate-300 hover:bg-white/5 transition flex items-center justify-between"
                >
                  <span>Team settings</span>
                  <span className="text-slate-500">›</span>
                </button>
              )}
              {team && (
                <button
                  type="button"
                  onClick={() => setShowLeaveTeamModal(true)}
                  className="w-full rounded-xl border border-red-500/40 px-4 py-3 text-base font-semibold text-red-400 hover:bg-red-500/10 transition"
                >
                  Leave {team.name}
                </button>
              )}
            </div>

            <div className="mt-4 border-t border-white/10 pt-4">
              <button type="button" onClick={handleLogout} className="w-full rounded-xl bg-red-600 px-4 py-3 text-base font-semibold text-white hover:bg-red-700 transition">
                Logout
              </button>
            </div>
          </div>
        )

      case "team-settings":
        return (
          <div className="flex-1">
            <h2 className="text-xl font-bold mt-6 mb-6">Team settings</h2>

            <div className="space-y-6">
              <div>
                <label className="text-sm text-slate-400 block mb-2">Team name</label>
                <input
                  type="text"
                  value={teamSettingsName}
                  onChange={(e) => setTeamSettingsName(e.target.value)}
                  maxLength={50}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400 block mb-2">Team image</label>
                <div className="relative rounded-xl overflow-hidden bg-white/5 border border-white/10 aspect-video flex items-center justify-center group cursor-pointer">
                  {teamImagePreview ? (
                    <img src={teamImagePreview} alt="Team image preview" className="absolute inset-0 object-cover w-full h-full" />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <ImagePlaceholderIcon />
                      <span className="text-sm text-slate-500">Upload an image</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                    <span className="text-white text-sm font-medium">Change image</span>
                  </div>
                  <label className="absolute inset-0 cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        setTeamImageFile(file)
                        setTeamImagePreview(URL.createObjectURL(file))
                      }}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-400 block mb-2">Description</label>
                <input
                  type="text"
                  value={teamDescription}
                  onChange={(e) => setTeamDescription(e.target.value)}
                  maxLength={80}
                  placeholder="Add a team tagline..."
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition"
                />
              </div>

              {teamSettingsError && <p className="text-red-400 text-sm">{teamSettingsError}</p>}

              <button
                type="button"
                onClick={handleSaveTeamSettings}
                disabled={!teamSettingsName.trim() || teamSettingsSaving}
                className="w-full rounded-xl bg-violet-600 px-4 py-3 text-base font-semibold text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {teamSettingsSaving ? "Saving..." : "Save team settings"}
              </button>
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

        <div style={{ opacity: authLoading ? 0 : 1, transition: "opacity 0.15s ease" }}>
          {(user || hasBeenLoggedIn) ? (
            avatarUrl ? (
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="h-12 w-12 rounded-full overflow-hidden shadow-lg transition hover:opacity-90"
                aria-label="Open account drawer"
              >
                <img src={avatarUrl} alt="Avatar" className="object-cover w-full h-full" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className={`h-12 w-12 rounded-full ${avatarColor} text-white flex items-center justify-center text-lg font-semibold shadow-lg transition hover:opacity-90`}
                aria-label="Open account drawer"
              >
                {initial}
              </button>
            )
          ) : (
            <Link href="/login" className="rounded-full bg-white hover:bg-slate-100 text-slate-900 px-5 py-2 text-sm font-semibold transition">
              Log in
            </Link>
          )}
        </div>
      </nav>

      {showDiscardPrompt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowDiscardPrompt(false)}
        >
          <div
            className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-2">Discard changes?</h3>
            <p className="text-slate-400 text-sm mb-6">Your unsaved changes will be lost.</p>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  setShowDiscardPrompt(false)
                  if (discardTarget === "settings") openSettings()
                  else if (discardTarget === "close") closeDrawer()
                  else setView("main")
                }}
                className="w-full rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold py-3 transition"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={() => setShowDiscardPrompt(false)}
                className="w-full rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold py-3 transition"
              >
                Keep editing
              </button>
            </div>
          </div>
        </div>
      )}

      {showLeaveTeamModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowLeaveTeamModal(false)}
        >
          <div
            className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-2">Leave {team?.name}?</h3>
            <p className="text-slate-400 text-sm mb-6">Your past entries will stay on the team, but new ones won't.</p>
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleLeaveTeam}
                disabled={submitting}
                className="w-full rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold py-3 transition disabled:opacity-50"
              >
                {submitting ? "Leaving..." : "Yes, leave"}
              </button>
              <button
                type="button"
                onClick={() => setShowLeaveTeamModal(false)}
                className="w-full rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold py-3 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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
