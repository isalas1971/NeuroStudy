"use client"

import { AuthGuard } from "@/components/auth/auth-guard"
import { AppShell } from "@/components/layout/app-shell"
import { CalendarView } from "@/components/calendar/calendar-view"

export default function CalendarPage() {
  return (
    <AuthGuard>
      <AppShell title="Calendario">
        <CalendarView />
      </AppShell>
    </AuthGuard>
  )
}
