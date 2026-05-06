"use client"

import { useState } from "react"
import NavCard from "@/components/NavCard"

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

export default function TeamSetupBanner() {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  return (
    <NavCard
      label="Set up your team"
      sublabel="Add an image and description"
      iconBgColor="bg-violet-600"
      iconContent={<EditIcon />}
      onClick={() => window.dispatchEvent(new CustomEvent("openNavTeamSettings"))}
      onDismiss={() => setDismissed(true)}
    />
  )
}
