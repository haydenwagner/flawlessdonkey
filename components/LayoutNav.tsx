"use client"

import { usePathname } from "next/navigation"
import Nav from "./Nav"

const NO_NAV = new Set(["/login", "/reset-password"])

export default function LayoutNav() {
  const pathname = usePathname()
  if (NO_NAV.has(pathname)) return null
  return (
    <div className="absolute inset-x-0 top-0 z-30 px-8 pt-8 pointer-events-none">
      <div className="max-w-2xl mx-auto pointer-events-auto">
        <Nav />
      </div>
    </div>
  )
}
