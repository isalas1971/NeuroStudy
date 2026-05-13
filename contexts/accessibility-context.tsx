"use client"

import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react"
import { useSupabaseAuth } from "@/contexts/supabase-auth-context"
import { getSupabaseClient } from "@/lib/supabase-client"

export type AccessibilityProfile = "none" | "adhd" | "dyslexia" | "autism"
export type ColorTheme = "default" | "light" | "dark"
export type SoundType = "none" | "brown-noise" | "white-noise" | "rain" | "forest"
export type DyslexiaFont = "opendyslexic" | "lexend" | "arial" | "helvetica"

interface PetItem {
  id: string
  name: string
  type: "food" | "accessory" | "bed" | "bowl"
  cost: number
  owned: boolean
  consumable?: boolean
}

interface StudyPet {
  name: string
  type: "cat" | "dog" | "bunny" | "hamster"
  level: number
  happiness: number
  items: PetItem[]
}

interface AccessibilitySettings {
  profile: AccessibilityProfile
  colorTheme: ColorTheme
  adhdMode: boolean
  dyslexiaMode: boolean
  autismMode: boolean
  studySessionDuration: number
  breakDuration: number
  reminderFrequency: "low" | "medium" | "high"
  reducedAnimations: boolean
  textToSpeech: boolean
  increasedSpacing: boolean
  simplifiedUI: boolean
  focusMode: boolean
  soundEnabled: boolean
  soundType: SoundType
  soundVolume: number
  useDyslexicFont: boolean
  dyslexiaFont: DyslexiaFont
  wordHighlighting: boolean
  microTasksEnabled: boolean
  guidedBreaks: boolean
}

interface GamificationState {
  points: number
  streak: number
  totalStudyMinutes: number
  sessionsCompleted: number
  pet: StudyPet
}

interface AccessibilityContextType {
  settings: AccessibilitySettings
  gamification: GamificationState
  updateProfile: (profile: AccessibilityProfile) => void
  toggleMode: (mode: "adhd" | "dyslexia" | "autism") => void
  updateSetting: <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => void
  updateGamification: <K extends keyof GamificationState>(key: K, value: GamificationState[K]) => void
  addPoints: (amount: number) => void
  purchaseItem: (itemId: string, cost: number) => boolean
  hasCompletedOnboarding: boolean
  completeOnboarding: () => void
  resetOnboarding: () => void
}

const defaultPetItems: PetItem[] = [
  // Food — consumable: siempre se pueden comprar
  { id: "food-1", name: "Croquetas", type: "food", cost: 30, owned: false, consumable: true },
  { id: "food-2", name: "Snacks", type: "food", cost: 60, owned: false, consumable: true },
  { id: "food-3", name: "Comida Gourmet", type: "food", cost: 100, owned: false, consumable: true },
  { id: "food-4", name: "Torta Especial", type: "food", cost: 150, owned: false, consumable: true },
  { id: "food-5", name: "Caja Sorpresa", type: "food", cost: 200, owned: false, consumable: true },
  // Accesorios — permanentes
  { id: "acc-1", name: "Collar Rojo", type: "accessory", cost: 150, owned: false },
  { id: "acc-2", name: "Moño Azul", type: "accessory", cost: 150, owned: false },
  { id: "acc-3", name: "Insignia Estrella", type: "accessory", cost: 300, owned: false },
  { id: "acc-4", name: "Medalla de Oro", type: "accessory", cost: 400, owned: false },
  { id: "acc-5", name: "Sombrero Arcoíris", type: "accessory", cost: 500, owned: false },
  { id: "acc-6", name: "Corona Real", type: "accessory", cost: 800, owned: false },
  // Camas — permanentes
  { id: "bed-1", name: "Cama Básica", type: "bed", cost: 200, owned: true },
  { id: "bed-2", name: "Cojín Suave", type: "bed", cost: 350, owned: false },
  { id: "bed-3", name: "Cama de Lujo", type: "bed", cost: 500, owned: false },
  { id: "bed-4", name: "Cama Real", type: "bed", cost: 750, owned: false },
  { id: "bed-5", name: "Cama Nube", type: "bed", cost: 1000, owned: false },
  // Platos — permanentes
  { id: "bowl-1", name: "Plato Básico", type: "bowl", cost: 100, owned: true },
  { id: "bowl-2", name: "Plato Cerámico", type: "bowl", cost: 200, owned: false },
  { id: "bowl-3", name: "Plato de Cristal", type: "bowl", cost: 400, owned: false },
  { id: "bowl-4", name: "Plato Dorado", type: "bowl", cost: 600, owned: false },
  { id: "bowl-5", name: "Plato Diamante", type: "bowl", cost: 1200, owned: false },
]

const defaultSettings: AccessibilitySettings = {
  profile: "none",
  colorTheme: "default",
  adhdMode: false,
  dyslexiaMode: false,
  autismMode: false,
  studySessionDuration: 25,
  breakDuration: 5,
  reminderFrequency: "medium",
  reducedAnimations: false,
  textToSpeech: false,
  increasedSpacing: false,
  simplifiedUI: false,
  focusMode: false,
  soundEnabled: false,
  soundType: "brown-noise",
  soundVolume: 50,
  useDyslexicFont: false,
  dyslexiaFont: "opendyslexic" as DyslexiaFont,
  wordHighlighting: false,
  microTasksEnabled: false,
  guidedBreaks: false,
}

const defaultGamification: GamificationState = {
  points: 100,
  streak: 0,
  totalStudyMinutes: 0,
  sessionsCompleted: 0,
  pet: {
    name: "Buddy",
    type: "cat",
    level: 1,
    happiness: 80,
    items: defaultPetItems,
  },
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined)

// Mapea la fila de DB → AccessibilitySettings
function dbRowToSettings(row: Record<string, unknown>): Partial<AccessibilitySettings> {
  return {
    profile: (row.accessibility_profile as AccessibilityProfile) ?? "none",
    adhdMode: (row.adhd_mode as boolean) ?? false,
    dyslexiaMode: (row.dyslexia_mode as boolean) ?? false,
    autismMode: (row.autism_mode as boolean) ?? false,
    increasedSpacing: (row.increased_spacing as boolean) ?? false,
    reducedAnimations: (row.reduced_animations as boolean) ?? false,
    textToSpeech: (row.text_to_speech as boolean) ?? false,
    wordHighlighting: (row.word_highlighting as boolean) ?? false,
    colorTheme: (row.color_theme as ColorTheme) ?? "default",
    soundEnabled: (row.sound_enabled as boolean) ?? true,
    soundType: (row.sound_type as SoundType) ?? "brown-noise",
    soundVolume: (row.sound_volume as number) ?? 50,
    studySessionDuration: (row.session_duration as number) ?? 25,
    breakDuration: (row.break_duration as number) ?? 5,
    useDyslexicFont: (row.use_dyslexic_font as boolean) ?? false,
    dyslexiaFont: (row.dyslexia_font as DyslexiaFont) ?? "opendyslexic",
    microTasksEnabled: (row.micro_tasks_enabled as boolean) ?? false,
    guidedBreaks: (row.guided_breaks as boolean) ?? false,
    focusMode: (row.focus_mode as boolean) ?? false,
    simplifiedUI: (row.simplified_ui as boolean) ?? false,
    reminderFrequency: (row.reminder_frequency as "low" | "medium" | "high") ?? "medium",
  }
}

// Mapea AccessibilitySettings → fila de DB
function settingsToDbRow(s: AccessibilitySettings, userId: string): Record<string, unknown> {
  return {
    user_id: userId,
    accessibility_profile: s.profile,
    adhd_mode: s.adhdMode,
    dyslexia_mode: s.dyslexiaMode,
    autism_mode: s.autismMode,
    increased_spacing: s.increasedSpacing,
    reduced_animations: s.reducedAnimations,
    text_to_speech: s.textToSpeech,
    word_highlighting: s.wordHighlighting,
    color_theme: s.colorTheme,
    sound_enabled: s.soundEnabled,
    sound_type: s.soundType,
    sound_volume: s.soundVolume,
    session_duration: s.studySessionDuration,
    break_duration: s.breakDuration,
    use_dyslexic_font: s.useDyslexicFont,
    dyslexia_font: s.dyslexiaFont,
    micro_tasks_enabled: s.microTasksEnabled,
    guided_breaks: s.guidedBreaks,
    focus_mode: s.focusMode,
    simplified_ui: s.simplifiedUI,
    reminder_frequency: s.reminderFrequency,
    updated_at: new Date().toISOString(),
  }
}

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const { user } = useSupabaseAuth()
  const supabase = getSupabaseClient()

  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings)
  const [gamification, setGamification] = useState<GamificationState>(defaultGamification)
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  // Evita guardar en Supabase antes de que se cargue el estado inicial
  const initialLoadDone = useRef(false)

  // ─── 1. Carga desde localStorage (inmediata, sin flash) ───────────────────
  useEffect(() => {
    const stored = localStorage.getItem("neurostudy-accessibility")
    const storedGamification = localStorage.getItem("neurostudy-gamification")
    const onboarded = localStorage.getItem("neurostudy-onboarded")

    if (stored) {
      try { setSettings(prev => ({ ...prev, ...JSON.parse(stored) })) } catch { /* usa defaults */ }
    }
    if (storedGamification) {
      try { setGamification(prev => ({ ...prev, ...JSON.parse(storedGamification) })) } catch { /* usa defaults */ }
    }
    setHasCompletedOnboarding(onboarded === "true")
    setIsLoaded(true)
  }, [])

  // ─── 2. Carga desde Supabase cuando el usuario está disponible ────────────
  useEffect(() => {
    if (!user || !supabase || !isLoaded) return

    const loadFromSupabase = async () => {
      try {
        const [{ data: accData }, { data: gamData }, { data: petData }, { data: profileData }] =
          await Promise.all([
            supabase.from("accessibility_settings").select("*").eq("user_id", user.id).single(),
            supabase.from("user_gamification").select("*").eq("user_id", user.id).single(),
            supabase.from("study_pet").select("*").eq("user_id", user.id).single(),
            supabase.from("user_profiles").select("has_completed_onboarding").eq("id", user.id).single(),
          ])

        if (accData) {
          const mapped = dbRowToSettings(accData as Record<string, unknown>)
          setSettings(prev => ({ ...prev, ...mapped }))
        }

        if (gamData || petData) {
          setGamification(prev => ({
            points: gamData?.points ?? prev.points,
            streak: gamData?.streak ?? prev.streak,
            totalStudyMinutes: gamData?.total_study_minutes ?? prev.totalStudyMinutes,
            sessionsCompleted: gamData?.sessions_completed ?? prev.sessionsCompleted,
            pet: {
              name: petData?.pet_name ?? prev.pet.name,
              type: (petData?.pet_type ?? prev.pet.type) as StudyPet["type"],
              level: petData?.level ?? prev.pet.level,
              happiness: petData?.happiness ?? prev.pet.happiness,
              items: Array.isArray(petData?.items) && petData.items.length > 0
                ? petData.items as PetItem[]
                : prev.pet.items,
            },
          }))
        }

        if (profileData) {
          const onboarded = profileData.has_completed_onboarding ?? false
          setHasCompletedOnboarding(onboarded)
          localStorage.setItem("neurostudy-onboarded", String(onboarded))
        }
      } catch {
        // Si falla Supabase, los datos de localStorage siguen activos
      } finally {
        initialLoadDone.current = true
      }
    }

    loadFromSupabase()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isLoaded])

  // ─── 3. Aplica clases CSS cuando cambia settings ──────────────────────────
  useEffect(() => {
    if (!isLoaded) return
    localStorage.setItem("neurostudy-accessibility", JSON.stringify(settings))

    const root = document.documentElement
    root.classList.remove("theme-default", "theme-light", "theme-dark", "dark")
    root.classList.add(`theme-${settings.colorTheme}`)
    if (settings.colorTheme === "dark") root.classList.add("dark")
    root.classList.toggle("reduced-motion", settings.reducedAnimations)
  }, [settings, isLoaded])

  // ─── 4. Persiste gamificación en localStorage ─────────────────────────────
  useEffect(() => {
    if (!isLoaded) return
    localStorage.setItem("neurostudy-gamification", JSON.stringify(gamification))
  }, [gamification, isLoaded])

  // ─── 5. Guarda settings en Supabase con debounce de 1s ───────────────────
  useEffect(() => {
    if (!isLoaded || !initialLoadDone.current || !user || !supabase) return

    const timer = setTimeout(async () => {
      await supabase
        .from("accessibility_settings")
        .upsert(settingsToDbRow(settings, user.id), { onConflict: "user_id" })
    }, 1000)

    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings, isLoaded, user?.id])

  // ─── 6. Guarda gamificación en Supabase con debounce de 1s ───────────────
  useEffect(() => {
    if (!isLoaded || !initialLoadDone.current || !user || !supabase) return

    const timer = setTimeout(async () => {
      await Promise.all([
        supabase.from("user_gamification").upsert({
          user_id: user.id,
          points: gamification.points,
          streak: gamification.streak,
          total_study_minutes: gamification.totalStudyMinutes,
          sessions_completed: gamification.sessionsCompleted,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" }),
        supabase.from("study_pet").upsert({
          user_id: user.id,
          pet_name: gamification.pet.name,
          pet_type: gamification.pet.type,
          level: gamification.pet.level,
          happiness: gamification.pet.happiness,
          items: gamification.pet.items,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" }),
      ])
    }, 1000)

    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gamification, isLoaded, user?.id])

  // ─── Helpers de perfil ────────────────────────────────────────────────────
  const applyProfileSettings = (profile: AccessibilityProfile): Partial<AccessibilitySettings> => {
    switch (profile) {
      case "adhd":
        return {
          adhdMode: true, dyslexiaMode: false, autismMode: false,
          studySessionDuration: 15, breakDuration: 5, reminderFrequency: "high",
          simplifiedUI: true, microTasksEnabled: true, guidedBreaks: true, focusMode: false,
        }
      case "dyslexia":
        return {
          adhdMode: false, dyslexiaMode: true, autismMode: false,
          textToSpeech: true, increasedSpacing: true, useDyslexicFont: true,
          dyslexiaFont: "opendyslexic" as DyslexiaFont,
          wordHighlighting: true, focusMode: false,
        }
      case "autism":
        return {
          adhdMode: false, dyslexiaMode: false, autismMode: true,
          reducedAnimations: true, simplifiedUI: false, focusMode: true,
        }
      default:
        return {
          adhdMode: false, dyslexiaMode: false, autismMode: false,
          studySessionDuration: 25, breakDuration: 5, reminderFrequency: "medium",
          reducedAnimations: false, textToSpeech: false, increasedSpacing: false,
          simplifiedUI: false, useDyslexicFont: false, wordHighlighting: false,
          microTasksEnabled: false, guidedBreaks: false, focusMode: false,
        }
    }
  }

  const updateProfile = (profile: AccessibilityProfile) => {
    setSettings(prev => ({ ...prev, profile, ...applyProfileSettings(profile) }))
  }

  const toggleMode = (mode: "adhd" | "dyslexia" | "autism") => {
    const modeKey = `${mode}Mode` as keyof AccessibilitySettings
    const isEnabling = !settings[modeKey]
    if (isEnabling) {
      setSettings(prev => ({ ...prev, ...applyProfileSettings(mode) }))
    } else {
      setSettings(prev => ({ ...prev, [modeKey]: false }))
    }
  }

  const updateSetting = <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const updateGamification = <K extends keyof GamificationState>(key: K, value: GamificationState[K]) => {
    setGamification(prev => ({ ...prev, [key]: value }))
  }

  const addPoints = (amount: number) => {
    setGamification(prev => ({ ...prev, points: prev.points + amount }))
  }

  const purchaseItem = (itemId: string, cost: number): boolean => {
    if (gamification.points < cost) return false
    setGamification(prev => {
      const item = prev.pet.items.find(i => i.id === itemId)
      const happinessBoost = item?.consumable ? 15 : 10
      return {
        ...prev,
        points: prev.points - cost,
        pet: {
          ...prev.pet,
          items: item?.consumable
            ? prev.pet.items
            : prev.pet.items.map(i => i.id === itemId ? { ...i, owned: true } : i),
          happiness: Math.min(100, prev.pet.happiness + happinessBoost),
        },
      }
    })
    return true
  }

  const completeOnboarding = async () => {
    setHasCompletedOnboarding(true)
    localStorage.setItem("neurostudy-onboarded", "true")
    if (user && supabase) {
      await supabase
        .from("user_profiles")
        .update({ has_completed_onboarding: true })
        .eq("id", user.id)
    }
  }

  const resetOnboarding = async () => {
    setHasCompletedOnboarding(false)
    localStorage.removeItem("neurostudy-onboarded")
    if (user && supabase) {
      await supabase
        .from("user_profiles")
        .update({ has_completed_onboarding: false })
        .eq("id", user.id)
    }
  }

  if (!isLoaded) return null

  return (
    <AccessibilityContext.Provider
      value={{
        settings,
        gamification,
        updateProfile,
        toggleMode,
        updateSetting,
        updateGamification,
        addPoints,
        purchaseItem,
        hasCompletedOnboarding,
        completeOnboarding,
        resetOnboarding,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  )
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext)
  if (!context) {
    throw new Error("useAccessibility must be used within AccessibilityProvider")
  }
  return context
}
