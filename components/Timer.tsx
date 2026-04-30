"use client"

import { useTimer } from "../hooks/useTimer"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/hooks/useAuth"

export default function Timer() {
  const { running, elapsed, start, stop } = useTimer()
  const { user } = useAuth()

  const handleStop = async () => {
    const duration = stop()
    console.log("[Timer] Stop button clicked. Duration:", duration, "ms")
    if (!duration) {
      console.log("[Timer] No duration, returning early")
      return
    }

    console.log("[Timer] useAuth hook user state:", user ? `${user.id} (${user.email})` : "null")

    // always get fresh session on save
    console.log("[Timer] Fetching fresh session from Supabase...")
    const { data: sessionData } = await supabase.auth.getSession()
    const freshUser = sessionData.session?.user
    console.log("[Timer] Fresh session user:", freshUser ? `${freshUser.id} (${freshUser.email})` : "null")

    // If user is logged in → save to DB
    if (freshUser) {
      console.log("[Timer] User logged in. Attempting to save result to DB...")
      try {
        const result = await supabase.from("results").insert({
          user_id: freshUser.id,
          duration_ms: duration,
        })
        console.log("[Timer] Insert result:", result)
      } catch (error) {
        console.error("[Timer] Error saving result:", error)
      }
    } else {
      console.log("[Timer] User not logged in. Skipping DB save.")
      // not logged in path. give option to log in to save result
    }
  }

  return (
    <div>
      <h2>{elapsed} ms</h2>

      {!running ? (
        <button onClick={start}>Start</button>
      ) : (
        <button onClick={handleStop}>Stop</button>
      )}
    </div>
  )
}
