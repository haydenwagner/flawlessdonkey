"use client"

import { ReactNode } from "react"

interface NavCardProps {
  label: string
  sublabel?: string
  iconBgColor: string
  iconContent: ReactNode
  onClick: () => void
}

export default function NavCard({ label, sublabel, iconBgColor, iconContent, onClick }: NavCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-[32px] border border-white/10 bg-white/5 p-5 text-left transition hover:bg-white/10"
    >
      <div className="flex items-center gap-4">
        <div className={`h-14 w-14 rounded-3xl ${iconBgColor} flex items-center justify-center text-2xl font-bold text-white flex-shrink-0`}>
          {iconContent}
        </div>
        <div>
          <div className="text-base font-semibold text-slate-100">{label}</div>
          {sublabel && <div className="text-sm text-slate-400">{sublabel}</div>}
        </div>
      </div>
    </button>
  )
}
