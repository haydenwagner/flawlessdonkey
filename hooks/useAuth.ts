"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"

export function useAuth() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    console.log("[useAuth] Initializing auth hook...")
    
    supabase.auth.getSession().then(({ data }) => {
      const sessionUser = data.session?.user ?? null
      console.log("[useAuth] Initial session check - User:", sessionUser ? `${sessionUser.id} (${sessionUser.email})` : "null")
      setUser(sessionUser)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const changedUser = session?.user ?? null
        console.log("[useAuth] Auth state changed - Event:", _event, "User:", changedUser ? `${changedUser.id} (${changedUser.email})` : "null")
        setUser(changedUser)
      }
    )

    return () => listener.subscription.unsubscribe()
  }, [])

  console.log("[useAuth] Returning user:", user ? `${user.id} (${user.email})` : "null")
  return { user }
}