import Image from "next/image"
import { cn } from "@/lib/utils"

interface NeuroStudyLogoProps {
  size?: number
  className?: string
  showText?: boolean
}

export function NeuroStudyLogo({ size = 64, className, showText = false }: NeuroStudyLogoProps) {
  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <Image
        src="/logo.jpeg"
        alt="NeuroStudy"
        width={size}
        height={size}
        className="rounded-2xl"
        priority
      />
      {showText && (
        <span className="font-bold text-lg" style={{ color: "#1B3A5C" }}>
          Neuro<span style={{ color: "#4191A8" }}>Study</span>
        </span>
      )}
    </div>
  )
}
