"use client"

import { useState } from "react"
import Timer from "../components/Timer"
import Nav from "../components/Nav"
import RecentTimes from "../components/RecentTimes"
import { useAuth } from "@/components/AuthProvider"

export default function HomePage() {
  const { user } = useAuth()
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleSaveSuccess = () => {
    console.log("[HomePage] Save successful, refreshing recent times")
    setRefreshTrigger((prev) => prev + 1)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8">
      <div className="max-w-md mx-auto">
        <Nav />
        <Timer onSaveSuccess={handleSaveSuccess} />
        {user && <RecentTimes refreshTrigger={refreshTrigger} />}
      </div>
    </div>
  )
}