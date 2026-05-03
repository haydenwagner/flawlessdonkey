"use client"

import { useState } from "react"
import Link from "next/link"
import { useTimer } from "../hooks/useTimer"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/components/AuthProvider"

export default function Timer({ onSaveSuccess }: { onSaveSuccess?: () => void }) {
  const { running, elapsed, start, stop, reset } = useTimer()
  const { user, team } = useAuth()
  const [saving, setSaving] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  const handleStop = async () => {
    const duration = stop()
    console.log("[Timer] Stop button clicked. Duration:", duration, "ms")
  }

  const handleSave = async () => {
    if (!user) {
      setShowLoginPrompt(true)
      return
    }
    console.log("[Timer] Save button clicked")
    setSaving(true)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const freshUser = sessionData.session?.user
      if (freshUser) {
        const displayName = freshUser.user_metadata?.display_name || freshUser.user_metadata?.full_name || freshUser.email || null
        const result = await supabase.from("results").insert({
          user_id: freshUser.id,
          duration_ms: elapsed,
          team_id: team?.id ?? null,
          user_display_name: displayName,
        })
        console.log("[Timer] Insert result:", result)
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

  // Left button: invisible when idle, Reset when running, Resume when paused
  const leftLabel = isPaused ? "Resume" : "Reset"
  const leftAction = isPaused
    ? () => { start(); console.log("[Timer] Resume clicked") }
    : () => { reset(); console.log("[Timer] Reset clicked") }
  const leftClassName = [
    "rounded-xl py-4 text-base font-semibold transition",
    isPaused
      ? "bg-green-600 hover:bg-green-700 text-white"
      : "bg-white/5 border border-white/10 hover:bg-white/10 text-white",
    elapsed === 0 && !running ? "opacity-0 pointer-events-none" : "opacity-100",
  ].join(" ")

  // Right button: Start / Stop / Save
  const rightLabel = running ? "Stop" : isPaused ? (saving ? "Saving..." : "Save") : "Start"
  const rightAction = running
    ? handleStop
    : isPaused
    ? handleSave
    : () => { start(); console.log("[Timer] Start clicked") }
  const rightClassName = [
    "rounded-xl py-4 text-base font-semibold text-white transition disabled:opacity-50 disabled:cursor-not-allowed",
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
          <span className="text-3xl font-mono font-bold text-yellow-400/60">s</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
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
              Create a free account to track your times and compete with friends.
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
