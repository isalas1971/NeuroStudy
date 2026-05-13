"use client"

import { AuthGuard } from "@/components/auth/auth-guard"
import { AppShell } from "@/components/layout/app-shell"
import { ProfileView } from "@/components/profile/profile-view"

export default function ProfilePage() {
  return (
    <AuthGuard>
      <AppShell title="Mi Perfil">
        <ProfileView />
      </AppShell>
    </AuthGuard>
  )
}
