"use client"

import { useSWRConfig } from "swr"
import Timer from "../components/Timer"
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
  const { mutate } = useSWRConfig()

  const handleSaveSuccess = () => {
    if (user) {
      mutate(["userStats", "user_id", user.id])
      mutate(["allTimes", "user_id", user.id])
      mutate(["recentTimes", user.id])
    }
    if (user && team) {
      mutate(["userStats", "team_id", team.id])
      mutate(["allTimes", "team_id", team.id])
      mutate(["leaders", team.id])
      mutate(["activity", team.id])
      mutate(["userHasTeamEntries", team.id, user.id])
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white px-8 pt-28 pb-8">
      <div className="max-w-2xl mx-auto">
        <Timer onSaveSuccess={handleSaveSuccess} />
        {user ? (
          <>
            <RecentTimes />
            <div className="mt-8 space-y-3">
              <NavCard
                label="My Dashboard"
                sublabel="Your personal piss"
                iconBgColor="bg-amber-500"
                iconContent={<DashboardIcon />}
                href="/dashboard"
              />
              {team && (
                <NavCard
                  label={team.name}
                  sublabel={team.description || "My Team"}
                  iconBgColor="bg-violet-600"
                  iconContent={team.name[0].toUpperCase()}
                  iconImageUrl={team.image_url}
                  href={`/team/${team.id}`}
                />
              )}
            </div>
          </>
        ) : (
          <div className="mt-8 space-y-3">
            <NavCard
              label="My Dashboard"
              sublabel="Log in to track your piss"
              iconBgColor="bg-amber-500"
              iconContent={<DashboardIcon />}
              href="/login"
            />
            <NavCard
              label="Join a Team"
              sublabel="Log in to piss with friends"
              iconBgColor="bg-violet-600"
              iconContent="+"
              href="/login"
            />
          </div>
        )}
      </div>
    </div>
  )
}
