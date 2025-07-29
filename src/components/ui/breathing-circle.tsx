import { cn } from "@/lib/utils"

interface BreathingCircleProps {
  isActive?: boolean
  phase?: "work" | "rest" | "prepare"
  size?: "sm" | "md" | "lg"
  className?: string
}

export function BreathingCircle({ 
  isActive = false, 
  phase = "prepare", 
  size = "md",
  className 
}: BreathingCircleProps) {
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-32 h-32", 
    lg: "w-48 h-48"
  }

  const phaseColors = {
    work: "border-accent",
    rest: "border-primary",
    prepare: "border-primary-glow"
  }

  const phaseGradients = {
    work: "bg-gradient-to-br from-accent/20 to-secondary/20",
    rest: "bg-gradient-to-br from-primary/20 to-primary-glow/20", 
    prepare: "bg-gradient-to-br from-primary-glow/20 to-primary/20"
  }

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      {/* Outer breathing ring */}
      <div 
        className={cn(
          "absolute rounded-full border-2 backdrop-blur-sm",
          sizeClasses[size],
          phaseColors[phase],
          isActive && "animate-breathe"
        )}
      />
      
      {/* Inner glowing circle */}
      <div 
        className={cn(
          "rounded-full backdrop-blur-md border border-white/20",
          "w-3/4 h-3/4",
          phaseGradients[phase],
          isActive && "animate-pulse-glow shadow-breath"
        )}
      />
      
      {/* Center dot */}
      <div className="absolute w-3 h-3 rounded-full bg-foreground/80 animate-float" />
      
      {/* Breathing guide text */}
      {isActive && (
        <div className="absolute -bottom-12 text-center">
          <p className="text-sm text-muted-foreground animate-fade-in-up">
            {phase === "work" ? "Deep breaths" : phase === "rest" ? "Flow with ease" : "Find your center"}
          </p>
        </div>
      )}
    </div>
  )
}