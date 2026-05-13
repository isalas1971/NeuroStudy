"use client"

import { AuthGuard } from "@/components/auth/auth-guard"
import { AppShell } from "@/components/layout/app-shell"
import { SettingsView } from "@/components/settings/settings-view"

export default function SettingsPage() {
  return (
    <AuthGuard>
      <AppShell title="Configuración">
        <SettingsView />
      </AppShell>
    </AuthGuard>
  )
}
