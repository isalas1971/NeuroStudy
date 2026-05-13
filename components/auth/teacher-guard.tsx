"use client"

import { useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { Loader2, ShieldAlert } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase-client"

type CheckState = "checking" | "allowed" | "denied"

export function TeacherGuard({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [checkState, setCheckState] = useState<CheckState>("checking")
  const [debugInfo, setDebugInfo] = useState<string>("")

  useEffect(() => {
    const verify = async () => {
      const supabase = getSupabaseClient()
      if (!supabase) {
        setDebugInfo("Error: Supabase client is null")
        setCheckState("denied")
        return
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        setDebugInfo(`Session error: ${sessionError.message}`)
        router.push("/teacher/login")
        return
      }

      if (!sessionData.session?.user) {
        setDebugInfo("No session found — redirecting to login")
        router.push("/teacher/login")
        return
      }

      const userId = sessionData.session.user.id

      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle()

      if (profileError) {
        setDebugInfo(`Profile query error (user: ${userId}): ${profileError.message} | code: ${profileError.code}`)
        setCheckState("denied")
        return
      }

      if (!profile) {
        setDebugInfo(`No profile row found for user: ${userId}`)
        setCheckState("denied")
        return
      }

      if (profile.role === "teacher" || profile.role === "admin") {
        setCheckState("allowed")
      } else {
        setDebugInfo(`Role is "${profile.role}" for user: ${userId} — access denied`)
        setCheckState("denied")
      }
    }

    verify()
  }, [router])

  if (checkState === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (checkState === "denied") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background p-8 text-center">
        <ShieldAlert className="h-12 w-12 text-destructive" />
        <h1 className="text-xl font-semibold text-foreground">Acceso restringido</h1>
        <p className="text-muted-foreground max-w-xs">
          Esta sección es solo para docentes. Si creés que esto es un error, contactá a tu institución.
        </p>
        {debugInfo && (
          <p className="text-xs text-muted-foreground bg-muted px-3 py-2 rounded max-w-sm break-all">
            {debugInfo}
          </p>
        )}
        <button
          onClick={() => router.push("/")}
          className="text-primary underline underline-offset-2 text-sm"
        >
          Volver al inicio
        </button>
      </div>
    )
  }

  return <>{children}</>
}
