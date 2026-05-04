"use client"

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react"
import { supabase } from "@/lib/supabaseClient"

export interface Team {
  id: string
  name: string
  code: string
  created_by: string
  image_url: string | null
  description: string | null
}

interface AuthContextType {
  user: any
  loading: boolean
  hasBeenLoggedIn: boolean
  team: Team | null
  teamLoading: boolean
  refreshTeam: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  hasBeenLoggedIn: false,
  team: null,
  teamLoading: false,
  refreshTeam: async () => {},
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
  const [team, setTeam] = useState<Team | null>(null)
  const [teamLoading, setTeamLoading] = useState(false)

  const fetchTeam = useCallback(async (userId: string) => {
    setTeamLoading(true)
    try {
      const { data } = await supabase
        .from("team_members")
        .select("teams(id, name, code, created_by, image_url, description)")
        .eq("user_id", userId)
        .is("left_at", null)
        .maybeSingle()
      setTeam(((data as any)?.teams as Team) ?? null)
    } catch {
      setTeam(null)
    } finally {
      setTeamLoading(false)
    }
  }, [])

  const refreshTeam = useCallback(async () => {
    const { data } = await supabase.auth.getSession()
    const userId = data.session?.user?.id
    if (userId) await fetchTeam(userId)
  }, [fetchTeam])

  useEffect(() => {
    const storedLoggedIn = typeof window !== "undefined" && localStorage.getItem("hasBeenLoggedIn") === "true"
    if (storedLoggedIn) setHasBeenLoggedIn(true)

    supabase.auth.getSession().then(({ data }) => {
      const sessionUser = data.session?.user ?? null
      setUser(sessionUser)
      if (sessionUser) {
        setHasBeenLoggedIn(true)
        localStorage.setItem("hasBeenLoggedIn", "true")
        fetchTeam(sessionUser.id)
      }
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      const changedUser = session?.user ?? null

      setUser(changedUser)

      if (changedUser) {
        setHasBeenLoggedIn(true)
        localStorage.setItem("hasBeenLoggedIn", "true")
        fetchTeam(changedUser.id)
      } else {
        if (event === "SIGNED_OUT") {
          setHasBeenLoggedIn(false)
          localStorage.removeItem("hasBeenLoggedIn")
        }
        setTeam(null)
      }

      setLoading(false)
    })

    return () => listener.subscription.unsubscribe()
  }, [fetchTeam])

  return (
    <AuthContext.Provider value={{ user, loading, hasBeenLoggedIn, team, teamLoading, refreshTeam }}>
      {children}
    </AuthContext.Provider>
  )
}
