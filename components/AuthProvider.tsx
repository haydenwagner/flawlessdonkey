"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { supabase } from "@/lib/supabaseClient"

interface AuthContextType {
  user: any
  loading: boolean
  hasBeenLoggedIn: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  hasBeenLoggedIn: false,
})

export function useAuth() {
  return useContext(AuthContext)
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [hasBeenLoggedIn, setHasBeenLoggedIn] = useState(false)

  useEffect(() => {
    console.log("[AuthProvider] Initializing auth provider...")

    // Check localStorage for previous login state
    const storedLoggedIn = typeof window !== 'undefined' && localStorage.getItem('hasBeenLoggedIn') === 'true'
    if (storedLoggedIn) {
      setHasBeenLoggedIn(true)
    }

    // Get initial session
    supabase.auth.getSession().then(({ data }) => {
      const sessionUser = data.session?.user ?? null
      console.log("[AuthProvider] Initial session check - User:", sessionUser ? `${sessionUser.id} (${sessionUser.email})` : "null")
      setUser(sessionUser)
      if (sessionUser) {
        setHasBeenLoggedIn(true)
        localStorage.setItem('hasBeenLoggedIn', 'true')
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const changedUser = session?.user ?? null
        console.log("[AuthProvider] Auth state changed - Event:", event, "User:", changedUser ? `${changedUser.id} (${changedUser.email})` : "null")

        setUser(changedUser)

        if (changedUser) {
          setHasBeenLoggedIn(true)
          localStorage.setItem('hasBeenLoggedIn', 'true')
        } else if (event === 'SIGNED_OUT') {
          setHasBeenLoggedIn(false)
          localStorage.removeItem('hasBeenLoggedIn')
        }

        setLoading(false)
      }
    )

    return () => listener.subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, hasBeenLoggedIn }}>
      {children}
    </AuthContext.Provider>
  )
}