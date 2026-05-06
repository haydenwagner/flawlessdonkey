"use client"

import { useState } from "react"

export default function TeamSetupBanner() {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-sm font-semibold text-white">Set up your team</div>
          <div className="text-xs text-slate-400 mt-0.5">Add an image and description to personalize your team page.</div>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-slate-500 hover:text-slate-300 transition text-lg leading-none ml-4 flex-shrink-0"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent("openNavTeamSettings"))}
          className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-5 py-2 rounded-xl transition text-sm"
        >
          Set up
        </button>
      </div>
    </div>
  )
}
