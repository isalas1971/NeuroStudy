"use client"

import { AuthGuard } from "@/components/auth/auth-guard"
import { AppShell } from "@/components/layout/app-shell"
import { StudyTimer } from "@/components/study/study-timer"
import { StudyPet } from "@/components/gamification/study-pet"
import { useAccessibility } from "@/contexts/accessibility-context"

function StudyContent() {
  const { settings } = useAccessibility()

  return (
    <AppShell title="Modo Estudio">
      <div className="space-y-6">
        <StudyTimer />
        {!settings.simplifiedUI && <StudyPet />}
      </div>
    </AppShell>
  )
}

export default function StudyPage() {
  return (
    <AuthGuard>
      <StudyContent />
    </AuthGuard>
  )
}
