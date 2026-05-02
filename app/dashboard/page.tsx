"use client"

import { useAuth } from "@/hooks/useAuth"
import Nav from "@/components/Nav"
import UserStats from "@/components/UserStats"
import AllTimes from "@/components/AllTimes"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function UserDashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!user) {
        router.push("/login")
      } else {
        setIsChecking(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [user, router])

  if (isChecking || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <Nav />
        <h1 className="text-4xl font-bold mb-8">Your Dashboard</h1>
        
        <UserStats />
        
        <div className="bg-slate-700 rounded-lg p-6 shadow-xl">
          <h2 className="text-2xl font-semibold mb-6">All Times</h2>
          <AllTimes />
        </div>
      </div>
    </div>
  )
}
