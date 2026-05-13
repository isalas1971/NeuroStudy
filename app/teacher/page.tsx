"use client"

import { TeacherGuard } from "@/components/auth/teacher-guard"
import { TeacherDashboard } from "@/components/teacher/teacher-dashboard"

export default function TeacherPage() {
  return (
    <TeacherGuard>
      <TeacherDashboard />
    </TeacherGuard>
  )
}
