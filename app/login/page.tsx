"use client"

import { supabase } from "@/lib/supabaseClient"

export default function LoginPage() {
  const signInWithGoogle = async () => {
    console.log("[LOGIN] Starting Google OAuth sign-in...")
    try {
      const result = await supabase.auth.signInWithOAuth({
        provider: "google",
      })
      console.log("[LOGIN] OAuth result:", result)
    } catch (error) {
      console.error("[LOGIN] OAuth error:", error)
    }
  }

  return (
    <div>
      <h1>Login</h1>

      <button onClick={signInWithGoogle}>
        Sign in with Google
      </button>
    </div>
  )
}