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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-8">Flawless Donkey</h1>
        <div className="bg-slate-700 rounded-lg p-12 shadow-xl">
          <h2 className="text-2xl font-semibold mb-6">Sign In</h2>
          <button onClick={signInWithGoogle} className="w-full bg-white text-slate-900 hover:bg-gray-100 py-3">
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  )
}