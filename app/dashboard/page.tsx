"use client"

import { useAuth } from "@/components/AuthProvider"
import Nav from "@/components/Nav"
import UserStats from "@/components/UserStats"
import AllTimes from "@/components/AllTimes"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function UserDashboardPage() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!user) {
        router.push("/login")
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [user, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <Nav />
        {/* Todo style this username better, have a card with image or somethign and the team will get this eventually */}
        <h1 className="text-3xl font-bold mb-6 break-words">{user?.email.split("@")[0]}</h1>
        
        <UserStats />
        
        <div className="bg-slate-700 rounded-lg p-6 shadow-xl">
          <h2 className="text-2xl font-semibold mb-6">All Piss</h2>
          <AllTimes />
        </div>
      </div>
    </div>
  )
}
