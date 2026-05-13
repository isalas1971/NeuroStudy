'use client'

import { useEffect } from 'react'
import { useAccessibility } from '@/contexts/accessibility-context'

const FONT_CLASSES = [
  'dyslexic-font-opendyslexic',
  'dyslexic-font-lexend',
  'dyslexic-font-arial',
  'dyslexic-font-helvetica',
]

export function DyslexiaFontProvider() {
  const { settings, hasCompletedOnboarding } = useAccessibility()

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove(...FONT_CLASSES)
    if (hasCompletedOnboarding && settings.useDyslexicFont && settings.dyslexiaFont) {
      root.classList.add(`dyslexic-font-${settings.dyslexiaFont}`)
    }
  }, [hasCompletedOnboarding, settings.useDyslexicFont, settings.dyslexiaFont])

  return null
}
