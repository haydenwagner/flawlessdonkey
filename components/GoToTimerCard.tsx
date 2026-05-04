"use client"

import { useRouter } from "next/navigation"
import NavCard from "@/components/NavCard"

function TimerIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12,6 12,12 16,14" />
    </svg>
  )
}

export default function GoToTimerCard({ label, sublabel }: { label: string; sublabel: string }) {
  const router = useRouter()
  return (
    <NavCard
      label={label}
      sublabel={sublabel}
      iconBgColor="bg-green-600"
      iconContent={<TimerIcon />}
      onClick={() => router.push("/")}
    />
  )
}
