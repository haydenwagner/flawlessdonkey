"use client"

import { ReactNode } from "react"
import Image from "next/image"

interface NavCardProps {
  label: string
  sublabel?: string
  iconBgColor: string
  iconContent: ReactNode
  iconImageUrl?: string | null
  onClick: () => void
  onDismiss?: () => void
}

export default function NavCard({ label, sublabel, iconBgColor, iconContent, iconImageUrl, onClick, onDismiss }: NavCardProps) {
  const icon = (
    <div className={`h-14 w-14 rounded-3xl flex-shrink-0 flex items-center justify-center text-2xl font-bold text-white overflow-hidden ${iconImageUrl ? "" : iconBgColor}`}>
      {iconImageUrl ? (
        <Image src={iconImageUrl} alt={label} width={56} height={56} className="object-cover w-full h-full" />
      ) : iconContent}
    </div>
  )

  const text = (
    <div className="flex-1 min-w-0">
      <div className="text-base font-semibold text-slate-100">{label}</div>
      {sublabel && <div className="text-sm text-slate-400">{sublabel}</div>}
    </div>
  )

  if (onDismiss) {
    return (
      <div className="w-full rounded-[32px] border border-white/10 bg-white/10 mb-6 flex items-center overflow-hidden">
        <button
          type="button"
          onClick={onClick}
          className="flex-1 flex items-center gap-4 p-5 text-left transition hover:bg-white/5 min-w-0"
        >
          {icon}
          {text}
          <div className="text-slate-500 text-xl flex-shrink-0">›</div>
        </button>
        <div className="w-px self-stretch bg-white/10 flex-shrink-0" />
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="px-5 text-slate-500 hover:text-slate-300 transition text-lg self-stretch flex items-center"
        >
          ✕
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-[32px] border border-white/10 bg-white/10 p-5 text-left transition hover:bg-white/15 mb-6"
    >
      <div className="flex items-center gap-4">
        {icon}
        {text}
        <div className="text-slate-500 text-xl flex-shrink-0">›</div>
      </div>
    </button>
  )
}
