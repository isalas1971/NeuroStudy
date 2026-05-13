"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import type { User, Session } from "@supabase/supabase-js"
import { getSupabaseClient } from "@/lib/supabase-client"

export type UserRole = "student" | "teacher" | "admin"

export interface AppUser extends User {
  name: string | null
  profilePicture: string | null
  role: UserRole
}

interface AuthContextType {
  user: AppUser | null
  session: Session | null
  isAuthenticated: boolean
  isLoading: boolean
  role: UserRole | null
  signUp: (email: string, password: string, name: string) => Promise<{ needsEmailConfirmation: boolean }>
  signIn: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: { name?: string; profilePicture?: string | null }) => Promise<void>
  error: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

async function fetchUserProfile(userId: string) {
  const supabase = getSupabaseClient()
  if (!supabase) return null
  const { data } = await supabase
    .from("user_profiles")
    .select("name, profile_picture, role")
    .eq("id", userId)
    .single()
  return data
}

async function ensureUserRecords(userId: string, displayName: string | null) {
  const supabase = getSupabaseClient()
  if (!supabase) return
  await Promise.allSettled([
    supabase.from("user_profiles").upsert(
      { id: userId, name: displayName, role: "student" },
      { onConflict: "id", ignoreDuplicates: true }
    ),
    supabase.from("accessibility_settings").upsert(
      { user_id: userId },
      { onConflict: "user_id", ignoreDuplicates: true }
    ),
    supabase.from("study_pet").upsert(
      { user_id: userId, pet_type: "cat", pet_name: "Buddy" },
      { onConflict: "user_id", ignoreDuplicates: true }
    ),
    supabase.from("user_gamification").upsert(
      { user_id: userId },
      { onConflict: "user_id", ignoreDuplicates: true }
    ),
  ])
}

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = getSupabaseClient()

  const buildAppUser = (base: User, profile: { name?: string | null; profile_picture?: string | null; role?: string | null } | null): AppUser => ({
    ...base,
    name: profile?.name ?? null,
    profilePicture: profile?.profile_picture ?? null,
    role: (profile?.role as UserRole) ?? "student",
  })

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false)
      return
    }

    const initSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) throw sessionError

        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id)
          setSession(session)
          setUser(buildAppUser(session.user, profile))
        }
      } catch (err) {
        console.error("Session init error:", err)
      } finally {
        setIsLoading(false)
      }
    }

    initSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        const currentUser = session.user
        // Set session immediately so isAuthenticated is true before isLoading becomes false
        setSession(session)
        setUser(buildAppUser(currentUser, null))

        // Defer Supabase DB queries outside the auth state-change lock to avoid deadlocks
        setTimeout(async () => {
          if (event === "SIGNED_IN") {
            const displayName =
              currentUser.user_metadata?.full_name ??
              currentUser.user_metadata?.name ??
              null
            await ensureUserRecords(currentUser.id, displayName)
          }
          const profile = await fetchUserProfile(currentUser.id)
          setUser(buildAppUser(currentUser, profile))
        }, 0)
      } else {
        setSession(null)
        setUser(null)
      }
      // Resolve loading only after session state is set
      if (event === "INITIAL_SESSION") setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const signUp = async (email: string, password: string, name: string): Promise<{ needsEmailConfirmation: boolean }> => {
    if (!supabase) throw new Error("Supabase no configurado")
    try {
      setError(null)
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password, options: { data: { name } } })
      if (signUpError) throw signUpError

      if (data.user) {
        await Promise.allSettled([
          supabase.from("user_profiles").upsert({ id: data.user.id, name, role: "student" }, { onConflict: "id", ignoreDuplicates: true }),
          supabase.from("accessibility_settings").upsert({ user_id: data.user.id }, { onConflict: "user_id", ignoreDuplicates: true }),
          supabase.from("study_pet").upsert({ user_id: data.user.id, pet_type: "cat", pet_name: "Buddy" }, { onConflict: "user_id", ignoreDuplicates: true }),
          supabase.from("user_gamification").upsert({ user_id: data.user.id }, { onConflict: "user_id", ignoreDuplicates: true }),
        ])
      }

      // If session is null but user exists → email confirmation is required
      return { needsEmailConfirmation: !!data.user && !data.session }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al registrarse"
      setError(message)
      throw err
    }
  }

  const signIn = async (email: string, password: string) => {
    if (!supabase) throw new Error("Supabase no configurado")
    try {
      setError(null)
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) throw signInError
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al iniciar sesión"
      setError(message)
      throw err
    }
  }

  const signInWithGoogle = async () => {
    if (!supabase) throw new Error("Supabase no configurado")
    try {
      setError(null)
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      })
      if (signInError) throw signInError
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error con Google"
      setError(message)
      throw err
    }
  }

  const signOut = async () => {
    if (!supabase) return
    try {
      setError(null)
      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) throw signOutError
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al cerrar sesión"
      setError(message)
      throw err
    }
  }

  const updateProfile = async (updates: { name?: string; profilePicture?: string | null }) => {
    if (!user || !supabase) return
    try {
      setError(null)
      const dbUpdates: Record<string, unknown> = { id: user.id, role: user.role || "student" }
      if (updates.name !== undefined) dbUpdates.name = updates.name
      if (updates.profilePicture !== undefined) dbUpdates.profile_picture = updates.profilePicture

      const { error: updateError } = await supabase
        .from("user_profiles")
        .upsert(dbUpdates, { onConflict: "id" })

      if (updateError) throw updateError

      setUser((prev) =>
        prev
          ? {
              ...prev,
              name: updates.name ?? prev.name,
              profilePicture: updates.profilePicture !== undefined ? updates.profilePicture : prev.profilePicture,
            }
          : null
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al actualizar perfil"
      setError(message)
      throw err
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated: !!session,
        isLoading,
        role: user?.role ?? null,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        updateProfile,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useSupabaseAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useSupabaseAuth must be used within SupabaseAuthProvider")
  }
  return context
}
