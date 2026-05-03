"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

type Mode = "sign-in" | "sign-up" | "forgot-password"

function friendlyError(msg: string): string {
  if (msg.includes("Invalid login credentials")) return "Incorrect email or password."
  if (msg.includes("Email not confirmed")) return "Please confirm your email before signing in."
  if (msg.includes("User already registered")) return "An account with this email already exists. Try signing in."
  if (msg.includes("Password should be at least")) return "Password must be at least 6 characters."
  return msg
}

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>("sign-in")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const reset = (nextMode: Mode) => {
    setError(null)
    setMessage(null)
    setPassword("")
    setMode(nextMode)
  }

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: "google" })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    if (mode === "sign-in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(friendlyError(error.message))
      } else {
        router.push("/")
      }
    } else if (mode === "sign-up") {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(friendlyError(error.message))
      } else if (data.session) {
        router.push("/")
      } else {
        setMessage("Check your email to confirm your account, then sign in.")
      }
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) {
        setError(friendlyError(error.message))
      } else {
        setMessage("Password reset link sent — check your email.")
      }
    }

    setLoading(false)
  }

  const isForgot = mode === "forgot-password"

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <Image src="/logo.png" alt="Logo" width={160} height={64} priority />
        </div>

        <h2 className="text-xl font-semibold text-center mb-6">
          {mode === "sign-in" && "Welcome back"}
          {mode === "sign-up" && "Create account"}
          {mode === "forgot-password" && "Reset password"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition"
          />

          {!isForgot && (
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition"
            />
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}
          {message && <p className="text-green-400 text-sm">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 transition"
          >
            {loading
              ? "..."
              : mode === "sign-in"
              ? "Sign in"
              : mode === "sign-up"
              ? "Create account"
              : "Send reset link"}
          </button>
        </form>

        {mode === "sign-in" && (
          <button
            type="button"
            onClick={() => reset("forgot-password")}
            className="mt-3 text-sm text-slate-400 hover:text-slate-300 transition w-full text-center"
          >
            Forgot password?
          </button>
        )}

        {!isForgot && (
          <>
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-slate-500">or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <button
              type="button"
              onClick={signInWithGoogle}
              className="w-full flex items-center justify-center gap-3 rounded-xl bg-white text-slate-900 hover:bg-slate-100 py-3 text-base font-semibold transition"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </>
        )}

        <div className="mt-6 text-center text-sm text-slate-400">
          {mode === "sign-in" && (
            <>Don't have an account?{" "}
              <button type="button" onClick={() => reset("sign-up")} className="text-white hover:text-slate-200 font-medium transition">
                Sign up
              </button>
            </>
          )}
          {mode === "sign-up" && (
            <>Already have an account?{" "}
              <button type="button" onClick={() => reset("sign-in")} className="text-white hover:text-slate-200 font-medium transition">
                Sign in
              </button>
            </>
          )}
          {mode === "forgot-password" && (
            <button type="button" onClick={() => reset("sign-in")} className="text-white hover:text-slate-200 font-medium transition">
              Back to sign in
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
