"use client"

import { SupabaseAuthProvider } from "@/contexts/supabase-auth-context"
import { AccessibilityProvider } from "@/contexts/accessibility-context"
import { DyslexiaFontProvider } from "@/components/providers/dyslexia-font-provider"
import type { ReactNode } from "react"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SupabaseAuthProvider>
      <AccessibilityProvider>
        <DyslexiaFontProvider />
        {children}
      </AccessibilityProvider>
    </SupabaseAuthProvider>
  )
}
