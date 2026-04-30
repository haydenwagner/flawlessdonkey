"use client"

import { useEffect } from "react"

export default function CleanUrl() {
  useEffect(() => {
    if (window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname)
      console.log("[CleanUrl] Cleaned URL - Hash removed")
    }
  }, [])

  return null
}