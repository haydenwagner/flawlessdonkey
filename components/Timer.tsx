"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useTimer } from "../hooks/useTimer"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/components/AuthProvider"

export default function Timer({ onSaveSuccess }: { onSaveSuccess?: () => void }) {
  const { running, elapsed, start, stop, reset } = useTimer()
  const { user, team } = useAuth()
  const [saving, setSaving] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const teamRef = useRef(team)
  useEffect(() => { teamRef.current = team }, [team])

  // When user signs in after hitting the login prompt, save the time they were trying to record
  useEffect(() => {
    if (!user) return
    const pending = sessionStorage.getItem("pendingTime")
    if (!pending) return
    const ms = parseInt(pending, 10)
    sessionStorage.removeItem("pendingTime")
    if (!ms || ms <= 0) return

    const doSave = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const freshUser = sessionData.session?.user
        if (!freshUser) return
        const displayName = freshUser.user_metadata?.display_name || freshUser.user_metadata?.full_name || freshUser.email || null
        const { error } = await supabase.from("results").insert({
          user_id: freshUser.id,
          duration_ms: ms,
          team_id: teamRef.current?.id ?? null,
          user_display_name: displayName,
        })
        if (error) {
          console.error("[Timer] Failed to save pending time:", error)
          return
        }
        supabase.from("profiles").upsert({
          id: freshUser.id,
          display_name: displayName,
          avatar_color: freshUser.user_metadata?.avatar_color ?? null,
          avatar_url: freshUser.user_metadata?.custom_avatar_url ?? null,
          updated_at: new Date().toISOString(),
        }, { onConflict: "id" })
        onSaveSuccess?.()
      } catch (err) {
        console.error("[Timer] Unexpected error saving pending time:", err)
      }
    }
    doSave()
  }, [user, onSaveSuccess])

  const handleStop = () => {
    stop()
  }

  const handleSave = async () => {
    if (!user) {
      sessionStorage.setItem("pendingTime", elapsed.toString())
      setShowLoginPrompt(true)
      return
    }
    setSaving(true)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const freshUser = sessionData.session?.user
      if (freshUser) {
        const displayName = freshUser.user_metadata?.display_name || freshUser.user_metadata?.full_name || freshUser.email || null
        const { error } = await supabase.from("results").insert({
          user_id: freshUser.id,
          duration_ms: elapsed,
          team_id: team?.id ?? null,
          user_display_name: displayName,
        })
        if (error) {
          console.error("[Timer] Failed to save result:", error)
          return
        }
        supabase.from("profiles").upsert({
          id: freshUser.id,
          display_name: displayName,
          avatar_color: freshUser.user_metadata?.avatar_color ?? null,
          avatar_url: freshUser.user_metadata?.custom_avatar_url ?? null,
          updated_at: new Date().toISOString(),
        }, { onConflict: "id" })
        reset()
        onSaveSuccess?.()
      }
    } catch (error) {
      console.error("[Timer] Error saving result:", error)
    } finally {
      setSaving(false)
    }
  }

  const displaySeconds = (elapsed / 1000).toFixed(1)
  const isPaused = elapsed > 0 && !running
  const isIdle = elapsed === 0 && !running

  // Left button: hidden when idle, Reset when running, Resume when paused
  const leftLabel = isPaused ? "Resume" : "Reset"
  const leftAction = isPaused ? start : reset
  const leftClassName = [
    "overflow-hidden min-w-0 rounded-xl py-4 text-base font-semibold transition-[opacity,background-color,color] duration-200",
    isPaused
      ? "bg-green-600 hover:bg-green-700 text-white"
      : "bg-white/5 border border-white/10 hover:bg-white/10 text-white",
    isIdle ? "opacity-0 pointer-events-none" : "opacity-100",
  ].join(" ")

  // Right button: Start / Stop / Save
  const rightLabel = running ? "Stop" : isPaused ? (saving ? "Saving..." : "Save") : "Start"
  const rightAction = running
    ? handleStop
    : isPaused
    ? handleSave
    : start
  const rightClassName = [
    "rounded-xl py-4 text-base font-semibold text-white transition-[background-color] duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
    running
      ? "bg-red-600 hover:bg-red-700"
      : isPaused
      ? "bg-violet-600 hover:bg-violet-700"
      : "bg-green-600 hover:bg-green-700",
  ].join(" ")

  return (
    <>
      <div className="py-8 text-center">
        <div className="flex items-baseline justify-center gap-3 mb-10">
          <span className="text-7xl font-mono font-bold tracking-wider text-yellow-400">
            {displaySeconds}
          </span>
          <span className="text-3xl font-mono font-bold text-yellow-400">s</span>
        </div>

        <div
          className="grid"
          style={{
            gridTemplateColumns: isIdle ? "0fr 1fr" : "1fr 1fr",
            columnGap: isIdle ? "0px" : "0.75rem",
            transition: "grid-template-columns 0.25s ease, column-gap 0.25s ease",
          }}
        >
          <button
            type="button"
            onClick={leftAction}
            disabled={saving}
            className={leftClassName}
          >
            {leftLabel}
          </button>
          <button
            type="button"
            onClick={rightAction}
            disabled={saving}
            className={rightClassName}
          >
            {rightLabel}
          </button>
        </div>
      </div>

      {showLoginPrompt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowLoginPrompt(false)}
        >
          <div
            className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm text-center"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-2">Log in to save</h3>
            <p className="text-slate-400 text-sm mb-6">
              Create a free account to track your piss and piss with friends.
            </p>
            <div className="space-y-3">
              <Link
                href="/login"
                className="block w-full rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 transition"
              >
                Log in
              </Link>
              <button
                type="button"
                onClick={() => setShowLoginPrompt(false)}
                className="w-full rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold py-3 transition"
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
