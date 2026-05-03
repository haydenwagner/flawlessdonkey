"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Timer from "../components/Timer"
import Nav from "../components/Nav"
import RecentTimes from "../components/RecentTimes"
import NavCard from "../components/NavCard"
import { useAuth } from "@/components/AuthProvider"

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23,6 13.5,15.5 8.5,10.5 1,18" />
      <polyline points="17,6 23,6 23,12" />
    </svg>
  )
}

export default function HomePage() {
  const { user, team } = useAuth()
  const router = useRouter()
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleSaveSuccess = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8">
      <div className="max-w-md mx-auto">
        <Nav />
        <Timer onSaveSuccess={handleSaveSuccess} />
        {user ? (
          <>
            <RecentTimes refreshTrigger={refreshTrigger} />
            <div className="mt-8 space-y-3">
              <NavCard
                label="My Dashboard"
                sublabel="Your personal stats"
                iconBgColor="bg-amber-500"
                iconContent={<DashboardIcon />}
                onClick={() => router.push("/dashboard")}
              />
              {team && (
                <NavCard
                  label={team.name}
                  sublabel="My Team"
                  iconBgColor="bg-violet-600"
                  iconContent={team.name[0].toUpperCase()}
                  onClick={() => router.push(`/team/${team.id}`)}
                />
              )}
            </div>
          </>
        ) : (
          <div className="mt-8 space-y-3">
            <NavCard
              label="My Dashboard"
              sublabel="Log in to track your stats"
              iconBgColor="bg-amber-500"
              iconContent={<DashboardIcon />}
              onClick={() => router.push("/login")}
            />
            <NavCard
              label="Join a Team"
              sublabel="Log in to compete with friends"
              iconBgColor="bg-violet-600"
              iconContent="+"
              onClick={() => router.push("/login")}
            />
          </div>
        )}
      </div>
    </div>
  )
}
