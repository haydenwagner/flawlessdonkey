"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/components/AuthProvider"

export default function Nav() {
  const { user, hasBeenLoggedIn } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const displayName = user?.email || user?.user_metadata?.full_name || ""
  const initial = displayName.trim()?.[0]?.toUpperCase() || "?"

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setDrawerOpen(false)
  }

  const handleNavClick = (href: string) => {
    if (pathname === href) {
      setDrawerOpen(false)
    } else {
      setDrawerOpen(false)
      router.push(href)
    }
  }

  return (
    <>
      <nav className="flex items-center justify-between mb-8">
        <button
          type="button"
          onClick={() => handleNavClick("/")}
          className="text-3xl font-bold hover:text-yellow-400 transition cursor-pointer"
        >
          Donkey
        </button>

        {(user || hasBeenLoggedIn) ? (
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="h-12 w-12 rounded-full bg-indigo-500 text-white flex items-center justify-center text-lg font-semibold shadow-lg transition hover:bg-indigo-400"
            aria-label="Open account drawer"
          >
            {initial}
          </button>
        ) : (
          <Link
            href="/login"
            className="rounded-full border border-white/20 px-4 py-2 text-sm font-medium hover:bg-white/10 transition"
          >
            Login
          </Link>
        )}
      </nav>

      {drawerOpen && (
        <div className="fixed inset-0 z-40 flex">
          <button
            type="button"
            className="absolute inset-0 z-10 bg-black/40 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close drawer"
          />

          <div className="ml-auto h-full w-full max-w-sm z-20 bg-slate-900 shadow-2xl border-l border-white/10 p-6 text-white flex flex-col">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="text-slate-400 hover:text-white"
                aria-label="Close drawer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1">
              <div className="mt-8 flex flex-col items-center gap-4">
                <div className="h-28 w-28 rounded-full bg-indigo-500 text-white flex items-center justify-center text-6xl font-bold shadow-lg">
                  {initial}
                </div>
                <div className="text-sm text-slate-300 text-center px-4">{user?.email}</div>
              </div>

              <div className="mt-12 grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleNavClick("/")}
                  className="rounded-[32px] border border-white/10 bg-white/5 overflow-hidden text-left transition hover:bg-white/10 relative"
                >
                  <div className="absolute top-0 bottom-0 left-0 w-10 bg-green-600 rounded-l-[32px]"></div>
                  <div className="relative p-2 flex items-center gap-4">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-6 w-6 text-white flex-shrink-0 z-10 relative"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12,6 12,12 16,14" />
                    </svg>
                    <div>
                      <div className="text-base font-semibold text-slate-100">Timer</div>
                      {/* <div className="text-sm text-slate-400">Track your runs</div> */}
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick("/dashboard")}
                  className="rounded-[32px] border border-white/10 bg-white/5 overflow-hidden text-left transition hover:bg-white/10 relative"
                >
                  <div className="absolute top-0 bottom-0 left-0 w-10 bg-amber-500 rounded-l-[32px]"></div>
                  <div className="relative p-2 flex items-center gap-4">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-6 w-6 text-white flex-shrink-0 z-10 relative"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="23,6 13.5,15.5 8.5,10.5 1,18" />
                      <polyline points="17,6 23,6 23,12" />
                    </svg>
                    <div>
                      <div className="text-base font-semibold text-slate-100">Dashboard</div>
                      {/* <div className="text-sm text-slate-400">View your stats</div> */}
                    </div>
                  </div>
                </button>
              </div>
              <div className="mt-4 rounded-[32px] border border-white/10 bg-white/5 p-5">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-3xl bg-slate-700 flex items-center justify-center text-2xl text-white">
                    T
                  </div>
                  <div>
                    <div className="text-base font-semibold text-slate-100">My Team</div>
                    <div className="text-sm text-slate-400">Team name, members, and activity</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-auto pt-6">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full rounded-xl bg-red-600 px-4 py-3 text-base font-semibold text-white hover:bg-red-700 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
