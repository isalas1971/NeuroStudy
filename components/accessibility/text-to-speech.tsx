"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Volume2, VolumeX, Pause, Play } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAccessibility } from "@/contexts/accessibility-context"

interface TextToSpeechProps {
  text: string
  className?: string
  showLabel?: boolean
}

export function TextToSpeech({ text, className, showLabel = false }: TextToSpeechProps) {
  const { settings } = useAccessibility()
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [utterance, setUtterance] = useState<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const newUtterance = new SpeechSynthesisUtterance(text)
      newUtterance.rate = 0.9
      newUtterance.pitch = 1
      newUtterance.volume = 0.8
      
      newUtterance.onend = () => {
        setIsSpeaking(false)
        setIsPaused(false)
      }
      
      newUtterance.onerror = () => {
        setIsSpeaking(false)
        setIsPaused(false)
      }
      
      setUtterance(newUtterance)
    }
    
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [text])

  const handleSpeak = useCallback(() => {
    if (!utterance) return
    
    if (isSpeaking && !isPaused) {
      window.speechSynthesis.pause()
      setIsPaused(true)
    } else if (isSpeaking && isPaused) {
      window.speechSynthesis.resume()
      setIsPaused(false)
    } else {
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utterance)
      setIsSpeaking(true)
      setIsPaused(false)
    }
  }, [utterance, isSpeaking, isPaused])

  const handleStop = useCallback(() => {
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
    setIsPaused(false)
  }, [])

  if (!settings.textToSpeech && !settings.dyslexiaMode) return null

  return (
    <div className={cn("inline-flex items-center gap-1", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSpeak}
        className={cn(
          "h-8 gap-1.5",
          isSpeaking && !isPaused && "text-primary",
          settings.dyslexiaMode && "tracking-wide"
        )}
        aria-label={isSpeaking ? (isPaused ? "Reanudar" : "Pausar") : "Leer en voz alta"}
      >
        {isSpeaking ? (
          isPaused ? (
            <Play className="h-4 w-4" />
          ) : (
            <Pause className="h-4 w-4" />
          )
        ) : (
          <Volume2 className="h-4 w-4" />
        )}
        {showLabel && (
          <span className="text-xs">
            {isSpeaking ? (isPaused ? "Reanudar" : "Pausar") : "Leer en voz alta"}
          </span>
        )}
      </Button>

      {isSpeaking && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleStop}
          className="h-8 w-8 p-0"
          aria-label="Detener lectura"
        >
          <VolumeX className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

// Wrapper component for readable content blocks
interface ReadableContentProps {
  children: React.ReactNode
  text: string
  className?: string
}

export function ReadableContent({ children, text, className }: ReadableContentProps) {
  const { settings } = useAccessibility()
  
  return (
    <div className={cn("relative group", className)}>
      {children}
      {(settings.textToSpeech || settings.dyslexiaMode) && (
        <div className="absolute -right-2 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <TextToSpeech text={text} />
        </div>
      )}
    </div>
  )
}
