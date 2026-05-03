"use client"

import { useAuth } from "@/components/AuthProvider"
import Nav from "@/components/Nav"
import UserStats from "@/components/UserStats"
import AllTimes from "@/components/AllTimes"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function UserDashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.push("/login")
  }, [user, loading, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <Nav />
        <h1 className="text-3xl font-bold mb-6 break-words">
          {user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.email?.split("@")[0]}
        </h1>

        {user && (
          <>
            <UserStats filter={{ column: "user_id", value: user.id }} />
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">All Piss</h2>
            <AllTimes filter={{ column: "user_id", value: user.id }} />
          </>
        )}
      </div>
    </div>
  )
}
