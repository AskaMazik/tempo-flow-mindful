import { useState, useEffect } from "react"
import { GlassButton } from "@/components/ui/glass-button"
import { BreathingCircle } from "@/components/ui/breathing-circle"
import { Card } from "@/components/ui/card"
import { Play, Pause, Square, RotateCcw } from "lucide-react"

type SessionPhase = "prepare" | "work" | "rest" | "complete"

export default function RunningSession() {
  const [isRunning, setIsRunning] = useState(false)
  const [currentPhase, setCurrentPhase] = useState<SessionPhase>("prepare")
  const [currentInterval, setCurrentInterval] = useState(1)
  const [timeRemaining, setTimeRemaining] = useState(120) // 2 minutes
  const [totalIntervals] = useState(5)

  // Mock session data
  const sessionConfig = {
    workDuration: 120, // 2 minutes
    restDuration: 60,  // 1 minute
    totalIntervals: 5
  }

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Phase transition logic
            if (currentPhase === "prepare") {
              setCurrentPhase("work")
              return sessionConfig.workDuration
            } else if (currentPhase === "work") {
              setCurrentPhase("rest")
              return sessionConfig.restDuration
            } else if (currentPhase === "rest") {
              if (currentInterval < totalIntervals) {
                setCurrentInterval(prev => prev + 1)
                setCurrentPhase("work")
                return sessionConfig.workDuration
              } else {
                setCurrentPhase("complete")
                setIsRunning(false)
                return 0
              }
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => clearInterval(interval)
  }, [isRunning, timeRemaining, currentPhase, currentInterval, totalIntervals])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getPhaseText = () => {
    switch (currentPhase) {
      case "prepare": return "Prepare yourself"
      case "work": return "Feel your strength"
      case "rest": return "Flow with ease"
      case "complete": return "Session complete"
    }
  }

  const getMantra = () => {
    switch (currentPhase) {
      case "work": return "I am strong, I am focused"
      case "rest": return "I breathe, I flow, I recover"
      case "prepare": return "I center myself in this moment"
      default: return "Well done, you found your rhythm"
    }
  }

  const handlePlayPause = () => {
    setIsRunning(!isRunning)
  }

  const handleReset = () => {
    setIsRunning(false)
    setCurrentPhase("prepare")
    setCurrentInterval(1)
    setTimeRemaining(10) // 10 second prep
  }

  const handleStop = () => {
    setIsRunning(false)
    setCurrentPhase("complete")
  }

  return (
    <div className="min-h-screen bg-gradient-primary flex flex-col relative overflow-hidden">
      {/* Dynamic background based on phase */}
      <div 
        className={`absolute inset-0 transition-all duration-1000 ${
          currentPhase === "work" 
            ? "bg-gradient-to-br from-accent/20 to-secondary/20"
            : currentPhase === "rest"
            ? "bg-gradient-to-br from-primary/20 to-primary-glow/20"
            : "bg-gradient-ethereal opacity-30"
        }`} 
      />

      {/* Floating ambient elements */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-breath rounded-full blur-3xl opacity-30 animate-float" />
      <div className="absolute bottom-1/3 right-1/4 w-24 h-24 bg-gradient-breath rounded-full blur-2xl opacity-20 animate-float" style={{ animationDelay: "3s" }} />

      <div className="relative z-10 flex flex-col h-full p-6 max-w-md mx-auto w-full">
        {/* Session Progress */}
        <div className="py-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">Interval</p>
          <h1 className="text-3xl font-light text-foreground">
            {currentInterval} / {totalIntervals}
          </h1>
        </div>

        {/* Main Timer Display */}
        <div className="flex-1 flex flex-col items-center justify-center space-y-8">
          {/* Breathing Circle */}
          <div className="relative">
            <BreathingCircle 
              isActive={isRunning} 
              phase={currentPhase === "complete" ? "prepare" : currentPhase as any}
              size="lg"
            />
            
            {/* Timer in center */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl font-light text-foreground mb-2">
                  {formatTime(timeRemaining)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {getPhaseText()}
                </div>
              </div>
            </div>
          </div>

          {/* Phase Guidance */}
          <Card className="p-4 bg-white/5 backdrop-blur-md border-white/20 text-center max-w-xs">
            <p className="text-sm text-muted-foreground italic">
              "{getMantra()}"
            </p>
          </Card>

          {/* Session Stats */}
          {currentPhase !== "complete" && (
            <div className="grid grid-cols-3 gap-4 w-full max-w-xs">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Phase</p>
                <p className="text-sm font-medium text-foreground capitalize">
                  {currentPhase}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Remaining</p>
                <p className="text-sm font-medium text-foreground">
                  {totalIntervals - currentInterval}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Next</p>
                <p className="text-sm font-medium text-foreground capitalize">
                  {currentPhase === "work" ? "Rest" : currentPhase === "rest" ? "Work" : "Work"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="py-6 space-y-4">
          {currentPhase !== "complete" ? (
            <>
              {/* Main Play/Pause */}
              <GlassButton
                variant="ethereal"
                size="xl"
                onClick={handlePlayPause}
                className="w-full"
              >
                {isRunning ? (
                  <Pause className="w-6 h-6 mr-2" />
                ) : (
                  <Play className="w-6 h-6 mr-2" />
                )}
                {isRunning ? "Pause" : "Start"}
              </GlassButton>

              {/* Secondary Controls */}
              <div className="flex gap-3">
                <GlassButton
                  variant="glass"
                  size="md"
                  onClick={handleReset}
                  className="flex-1"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </GlassButton>
                <GlassButton
                  variant="glass"
                  size="md"
                  onClick={handleStop}
                  className="flex-1"
                >
                  <Square className="w-4 h-4 mr-2" />
                  Stop
                </GlassButton>
              </div>
            </>
          ) : (
            /* Session Complete */
            <div className="space-y-4 text-center">
              <div className="py-4">
                <h2 className="text-2xl font-light text-foreground mb-2">
                  Beautiful Work
                </h2>
                <p className="text-muted-foreground">
                  You've completed your mindful interval session
                </p>
              </div>
              
              <GlassButton
                variant="ethereal"
                size="lg"
                onClick={() => {/* Navigate to reflection */}}
                className="w-full"
              >
                Reflect on Your Practice
              </GlassButton>
              
              <GlassButton
                variant="glass"
                size="md"
                onClick={handleReset}
                className="w-full"
              >
                Start New Session
              </GlassButton>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}