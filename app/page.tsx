"use client"

import Link from "next/link"
import { Loader2 } from "lucide-react"
import { NeuroStudyLogo } from "@/components/ui/neurostudy-logo"
import { AuthGuard } from "@/components/auth/auth-guard"
import { useAccessibility } from "@/contexts/accessibility-context"
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow"
import { AppShell } from "@/components/layout/app-shell"
import { DashboardView } from "@/components/dashboard/dashboard-view"
import { useSupabaseAuth } from "@/contexts/supabase-auth-context"
import { Button } from "@/components/ui/button"

function HomeContent() {
  const { hasCompletedOnboarding } = useAccessibility()

  if (!hasCompletedOnboarding) {
    return <OnboardingFlow />
  }

  return (
    <AppShell>
      <DashboardView />
    </AppShell>
  )
}

export default function Home() {
  const { isAuthenticated, isLoading } = useSupabaseAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (isAuthenticated) {
    return (
      <AuthGuard>
        <HomeContent />
      </AuthGuard>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
      <div className="flex flex-col items-center gap-4 mb-8">
        <NeuroStudyLogo size={120} />
        <p className="text-muted-foreground text-center max-w-xs">Tu plataforma de estudio personalizada</p>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <Button asChild size="lg" className="w-full">
          <Link href="/auth/login">Soy Alumno</Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="w-full">
          <Link href="/teacher/login">Soy Docente</Link>
        </Button>
      </div>

      <p className="mt-12 text-xs text-muted-foreground">© 2025 NeuroStudy</p>
    </div>
  )
}
