"use client"

import { useState } from "react"
import { useTimer } from "../hooks/useTimer"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/hooks/useAuth"

export default function Timer({ onSaveSuccess }: { onSaveSuccess?: () => void }) {
  const { running, elapsed, start, stop, reset } = useTimer()
  const { user } = useAuth()
  const [saving, setSaving] = useState(false)

  const handleStop = async () => {
    const duration = stop()
    console.log("[Timer] Stop button clicked. Duration:", duration, "ms")
  }

  const handleSave = async () => {
    console.log("[Timer] Save button clicked")
    setSaving(true)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const freshUser = sessionData.session?.user
      console.log("[Timer] Fresh session user:", freshUser ? `${freshUser.id} (${freshUser.email})` : "null")

      if (freshUser) {
        console.log("[Timer] User logged in. Attempting to save result to DB...")
        const result = await supabase.from("results").insert({
          user_id: freshUser.id,
          duration_ms: elapsed,
        })
        console.log("[Timer] Insert result:", result)
        reset()
        console.log("[Timer] Timer reset after successful save")
        onSaveSuccess?.()
      } else {
        console.log("[Timer] User not logged in. Skipping DB save.")
      }
    } catch (error) {
      console.error("[Timer] Error saving result:", error)
    } finally {
      setSaving(false)
    }
  }

  const displaySeconds = (elapsed / 1000).toFixed(1)

  return (
    <div className="bg-slate-700 rounded-lg p-8 shadow-xl relative pt-22">
      <button
        type="button"
        onClick={() => { reset(); console.log("[Timer] Reset button clicked") }}
        disabled={saving}
        className={`absolute top-4 left-4 px-4 flex items-center justify-center text-4xl text-white hover:text-yellow-400 transition ${
          elapsed > 0 && !saving ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-label="Reset timer"
      >
        ↻
      </button>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving || !(!running && elapsed > 0)}
        className={`absolute top-4 right-4 px-4 py-2 rounded-lg text-white font-semibold transition ${
          !running && elapsed > 0 && !saving ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-500 opacity-50 cursor-not-allowed'
        }`}
        aria-label="Save result"
      >
        {saving ? "Saving..." : "Save"}
      </button>

      <div className="text-center">
        <div className="text-6xl font-mono font-bold mb-8 tracking-wider text-yellow-400">{displaySeconds} s</div>

        {!running ? (
          <button onClick={() => { start(); console.log("[Timer] Start button clicked") }} disabled={saving} className="w-full rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-lg py-3">Start</button>
        ) : (
          <button onClick={handleStop} disabled={saving} className="w-full rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-lg py-3">Stop</button>
        )}
      </div>
    </div>
  )
}
