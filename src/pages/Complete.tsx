import { GlassButton } from "@/components/ui/glass-button"
import { Card } from "@/components/ui/card"
import { Trophy, RotateCcw, Home } from "lucide-react"
import { IntervalConfig } from "./Setup"

interface CompleteProps {
  config: IntervalConfig
  onRestart: () => void
  onNewSession: () => void
  onHome: () => void
}

export default function Complete({ config, onRestart, onNewSession, onHome }: CompleteProps) {
  const totalTime = config.isTimeBased 
    ? (config.workDuration + config.restDuration) * config.intervalCount
    : Math.round(((config.workDuration + config.restDuration) * config.intervalCount) / 200)

  return (
    <div className="min-h-screen bg-gradient-primary flex flex-col p-6 relative overflow-hidden">
      {/* Glass morphism background */}
      <div className="absolute inset-0 bg-gradient-glass" />
      <div className="absolute top-1/4 left-1/3 w-64 h-64 bg-gradient-primary rounded-full blur-3xl opacity-20 animate-pulse" />
      <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-accent rounded-full blur-3xl opacity-15 animate-pulse" style={{animationDelay: '1s'}} />

      <div className="relative z-10 flex flex-col h-full max-w-md mx-auto w-full justify-center">
        {/* Success Message */}
        <div className="text-center mb-12">
          <div className="mx-auto w-24 h-24 mb-6 flex items-center justify-center">
            <Trophy className="w-16 h-16 text-accent animate-pulse" />
          </div>
          <h1 className="text-5xl font-bold text-foreground mb-4">
            Well Done!
          </h1>
          <p className="text-xl text-muted-foreground">
            Session Complete
          </p>
        </div>

        {/* Session Stats */}
        <Card className="p-8 mb-8 backdrop-blur-md border-0 text-center" style={{background: 'var(--glass-bg)', boxShadow: 'var(--glass-shadow)'}}>
          <div className="space-y-4">
            <div>
              <p className="text-muted-foreground mb-2">Intervals Completed</p>
              <p className="text-4xl font-bold text-foreground">{config.intervalCount}</p>
            </div>
            <div className="w-full h-px bg-foreground/20 my-4" />
            <div>
              <p className="text-muted-foreground mb-2">Total Time</p>
              <p className="text-2xl font-bold text-accent">~{totalTime} minutes</p>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-4">
          <GlassButton 
            variant="ethereal" 
            size="xl" 
            className="w-full"
            onClick={onRestart}
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Run Again
          </GlassButton>
          
          <GlassButton 
            variant="glass" 
            size="lg" 
            className="w-full"
            onClick={onNewSession}
          >
            New Session
          </GlassButton>
          
          <GlassButton 
            variant="glass" 
            size="lg" 
            className="w-full"
            onClick={onHome}
          >
            <Home className="w-5 h-5 mr-2" />
            Home
          </GlassButton>
        </div>
      </div>
    </div>
  )
}