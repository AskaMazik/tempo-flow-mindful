import { useState, useEffect } from "react"
import { GlassButton } from "@/components/ui/glass-button"

interface CountdownProps {
  onComplete: () => void
  onCancel: () => void
}

export default function Countdown({ onComplete, onCancel }: CountdownProps) {
  const [count, setCount] = useState(3)

  useEffect(() => {
    if (count > 0) {
      const timer = setTimeout(() => setCount(count - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      onComplete()
    }
  }, [count, onComplete])

  return (
    <div className="min-h-screen bg-gradient-primary flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Glass morphism background */}
      <div className="absolute inset-0 bg-gradient-glass" />
      <div className="absolute top-1/4 left-1/3 w-64 h-64 bg-gradient-primary rounded-full blur-3xl opacity-20 animate-pulse" />
      <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-accent rounded-full blur-3xl opacity-15 animate-pulse" style={{animationDelay: '1s'}} />

      <div className="relative z-10 text-center">
        {count > 0 ? (
          <>
            <p className="text-2xl font-light text-muted-foreground mb-8">Get Ready</p>
            <div 
              className="text-9xl font-bold text-foreground mb-12 animate-pulse"
              style={{textShadow: '0 0 40px hsl(var(--primary) / 0.5)'}}
            >
              {count}
            </div>
            <GlassButton 
              variant="glass" 
              onClick={onCancel}
              className="px-8"
            >
              Cancel
            </GlassButton>
          </>
        ) : (
          <div 
            className="text-7xl font-bold text-accent animate-pulse"
            style={{textShadow: '0 0 40px hsl(var(--accent) / 0.8)'}}
          >
            GO!
          </div>
        )}
      </div>
    </div>
  )
}