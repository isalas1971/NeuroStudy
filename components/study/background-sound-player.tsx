"use client"

import { useEffect, useRef, useState } from "react"
import { Slider } from "@/components/ui/slider"
import { Volume2, VolumeX } from "lucide-react"

interface BackgroundSoundPlayerProps {
  soundType: "brown_noise" | "white_noise" | "rain" | "forest"
  volume: number
  onVolumeChange: (volume: number) => void
  enabled: boolean
  onEnabledChange: (enabled: boolean) => void
  timerRunning?: boolean
}

const SOUND_CONFIG = {
  brown_noise: { label: "Ruido Café", videoId: "WVLUcw-lxZ0" },
  white_noise: { label: "Ruido Blanco", videoId: "APXp4PGZSiI" },
  rain: { label: "Lluvia", videoId: "fjb4MnwLwYg" },
  forest: { label: "Bosque", videoId: "xNN7iTA57jM" },
}

export function BackgroundSoundPlayer({
  soundType,
  volume,
  onVolumeChange,
  timerRunning,
}: BackgroundSoundPlayerProps) {
  const playerRef = useRef<any>(null)
  const [isReady, setIsReady] = useState(false)
  const currentSoundRef = useRef(soundType)
  const pendingPlayRef = useRef(false)

  const initPlayer = () => {
    if (playerRef.current) {
      try { playerRef.current.destroy() } catch { /* already destroyed */ }
    }
    playerRef.current = new window.YT.Player("yt-ambient-player", {
      height: "0",
      width: "0",
      videoId: SOUND_CONFIG[currentSoundRef.current].videoId,
      playerVars: { controls: 0, modestbranding: 1, rel: 0, showinfo: 0 },
      events: {
        onReady: (e: any) => {
          setIsReady(true)
          e.target.setVolume(volume)
          e.target.setLoop(true)
          if (pendingPlayRef.current) {
            e.target.playVideo()
            pendingPlayRef.current = false
          }
        },
      },
    })
  }

  useEffect(() => {
    if (typeof window === "undefined") return
    if (!window.YT || !window.YT.Player) {
      const tag = document.createElement("script")
      tag.src = "https://www.youtube.com/iframe_api"
      document.head.appendChild(tag)
      window.onYouTubeIframeAPIReady = initPlayer
    } else {
      initPlayer()
    }
    return () => {
      if (playerRef.current) try { playerRef.current.destroy() } catch { /* ok */ }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Change track when soundType changes
  useEffect(() => {
    if (!isReady || !playerRef.current) return
    if (soundType === currentSoundRef.current) return
    currentSoundRef.current = soundType
    if (timerRunning) {
      playerRef.current.loadVideoById(SOUND_CONFIG[soundType].videoId)
    } else {
      playerRef.current.cueVideoById(SOUND_CONFIG[soundType].videoId)
    }
  }, [soundType, isReady, timerRunning])

  // Sync volume
  useEffect(() => {
    if (!isReady || !playerRef.current) return
    playerRef.current.setVolume(volume)
  }, [volume, isReady])

  // Play/pause driven by timer state
  useEffect(() => {
    if (!isReady || !playerRef.current) {
      pendingPlayRef.current = !!timerRunning
      return
    }
    if (timerRunning) {
      playerRef.current.playVideo()
    } else {
      playerRef.current.pauseVideo()
    }
  }, [timerRunning, isReady])

  return (
    <div className="space-y-4">
      <div id="yt-ambient-player" style={{ display: "none" }} />

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{SOUND_CONFIG[soundType].label}</span>
        {!isReady && (
          <span className="text-xs text-muted-foreground">· Cargando...</span>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {volume === 0
            ? <VolumeX className="h-4 w-4 text-muted-foreground" />
            : <Volume2 className="h-4 w-4 text-muted-foreground" />
          }
          <span className="text-sm text-muted-foreground">Volumen</span>
        </div>
        <Slider
          value={[volume]}
          onValueChange={(v) => onVolumeChange(v[0])}
          max={100}
          step={1}
          className="w-full"
        />
        <div className="text-xs text-muted-foreground text-right">{volume}%</div>
      </div>
    </div>
  )
}

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}
