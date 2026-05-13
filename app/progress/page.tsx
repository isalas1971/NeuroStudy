"use client"

import { AuthGuard } from "@/components/auth/auth-guard"
import { AppShell } from "@/components/layout/app-shell"
import { ProgressView } from "@/components/progress/progress-view"

export default function ProgressPage() {
  return (
    <AuthGuard>
      <AppShell title="Mi Progreso">
        <ProgressView />
      </AppShell>
    </AuthGuard>
  )
}
