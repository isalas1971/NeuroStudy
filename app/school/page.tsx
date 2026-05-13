"use client"

import { AuthGuard } from "@/components/auth/auth-guard"
import { AppShell } from "@/components/layout/app-shell"
import { SchoolView } from "@/components/school/school-view"

export default function SchoolPage() {
  return (
    <AuthGuard>
      <AppShell title="Mi Escuela">
        <SchoolView />
      </AppShell>
    </AuthGuard>
  )
}
