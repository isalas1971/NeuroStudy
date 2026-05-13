"use client"

import { cn } from "@/lib/utils"
import { useAccessibility } from "@/contexts/accessibility-context"

interface StudyPlantProps {
  level: number // 1-5
  streak: number
}

export function StudyPlant({ level, streak }: StudyPlantProps) {
  const { settings } = useAccessibility()
  
  // Plant growth stages
  const plantStages = [
    { height: 20, leaves: 0, pot: true },
    { height: 35, leaves: 2, pot: true },
    { height: 50, leaves: 4, pot: true },
    { height: 70, leaves: 6, pot: true },
    { height: 90, leaves: 8, pot: true, flower: true },
  ]
  
  const stage = plantStages[Math.min(level - 1, 4)]

  return (
    <div className="flex flex-col items-center">
      <div 
        className={cn(
          "relative w-24 h-28 flex items-end justify-center",
          !settings.reducedAnimations && "transition-all duration-500"
        )}
      >
        {/* Stem */}
        <div
          className="absolute bottom-8 w-1.5 bg-green-500 rounded-full origin-bottom"
          style={{ height: `${stage.height}%` }}
        />
        
        {/* Leaves */}
        {Array.from({ length: stage.leaves }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "absolute w-4 h-2 bg-green-400 rounded-full",
              !settings.reducedAnimations && "transition-all duration-300"
            )}
            style={{
              bottom: `${20 + (i * 12)}%`,
              left: i % 2 === 0 ? "35%" : "55%",
              transform: i % 2 === 0 ? "rotate(-30deg)" : "rotate(30deg)",
            }}
          />
        ))}
        
        {/* Flower */}
        {stage.flower && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2">
            <div className="relative">
              <div className="w-4 h-4 bg-pink-400 rounded-full" />
              <div className="absolute -top-1 -left-1 w-3 h-3 bg-pink-300 rounded-full" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-pink-300 rounded-full" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-yellow-400 rounded-full" />
            </div>
          </div>
        )}
        
        {/* Pot */}
        <div className="absolute bottom-0 w-10 h-8 bg-amber-600 rounded-b-lg">
          <div className="absolute top-0 left-0 right-0 h-2 bg-amber-700 rounded-sm" />
        </div>
      </div>
      
      <div className="mt-2 text-center">
        <p className={cn(
          "text-sm font-medium text-foreground",
          settings.dyslexiaMode && "tracking-wide"
        )}>
          Level {level} Plant
        </p>
        <p className="text-xs text-muted-foreground">
          {streak} day streak
        </p>
      </div>
    </div>
  )
}
