import { useState, useEffect, useRef } from "react"
import { GlassButton } from "@/components/ui/glass-button"
import { Card } from "@/components/ui/card"
import { Play, Pause, Square, RotateCcw } from "lucide-react"
import { IntervalConfig } from "./Setup"

type SessionPhase = "work" | "recover" | "complete"

interface RunningProps {
  config: IntervalConfig
  onReset: () => void
}

export default function Running({ config, onReset }: RunningProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [currentPhase, setCurrentPhase] = useState<SessionPhase>("work")
  const [currentInterval, setCurrentInterval] = useState(1)
  const [timeRemaining, setTimeRemaining] = useState(
    config.isTimeBased ? config.workDuration * 60 : config.workDuration
  )
  const audioContextRef = useRef<AudioContext | null>(null)

  // Simple audio chime function
  const playChime = (frequency: number = 800) => {
    if (!config.audioEnabled) return
    
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
      
      const oscillator = audioContextRef.current.createOscillator()
      const gainNode = audioContextRef.current.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContextRef.current.destination)
      
      oscillator.frequency.setValueAtTime(frequency, audioContextRef.current.currentTime)
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0, audioContextRef.current.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.1, audioContextRef.current.currentTime + 0.1)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.8)
      
      oscillator.start(audioContextRef.current.currentTime)
      oscillator.stop(audioContextRef.current.currentTime + 0.8)
    } catch (error) {
      console.log("Audio not available")
    }
  }

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Phase transition logic
            if (currentPhase === "work") {
              // Switch to recovery
              playChime(600) // Lower tone for recovery
              setCurrentPhase("recover")
              return config.isTimeBased ? config.restDuration * 60 : config.restDuration
            } else if (currentPhase === "recover") {
              if (currentInterval < config.intervalCount) {
                // Switch to next work interval
                playChime(800) // Higher tone for work
                setCurrentInterval(prev => prev + 1)
                setCurrentPhase("work")
                return config.isTimeBased ? config.workDuration * 60 : config.workDuration
              } else {
                // Session complete
                playChime(1000) // High completion tone
                setCurrentPhase("complete")
                setIsRunning(false)
                return 0
              }
            }
            return 0
          }
          return prev - 1
        })
      }, config.isTimeBased ? 1000 : 500) // Faster countdown for distance
    }

    return () => clearInterval(interval)
  }, [isRunning, timeRemaining, currentPhase, currentInterval, config])

  const formatTime = (seconds: number) => {
    if (!config.isTimeBased) {
      return `${seconds}m`
    }
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getProgressPercentage = () => {
    const totalPhaseTime = currentPhase === "work" 
      ? (config.isTimeBased ? config.workDuration * 60 : config.workDuration)
      : (config.isTimeBased ? config.restDuration * 60 : config.restDuration)
    
    return ((totalPhaseTime - timeRemaining) / totalPhaseTime) * 100
  }

  const handlePlayPause = () => {
    setIsRunning(!isRunning)
  }

  const handleReset = () => {
    setIsRunning(false)
    setCurrentPhase("work")
    setCurrentInterval(1)
    setTimeRemaining(config.isTimeBased ? config.workDuration * 60 : config.workDuration)
  }

  const handleStop = () => {
    setIsRunning(false)
    onReset()
  }

  return (
    <div className={`min-h-screen flex flex-col relative overflow-hidden transition-all duration-1000 ${
      currentPhase === "work" 
        ? "bg-gradient-to-br from-accent/40 to-secondary/40"
        : currentPhase === "recover"
        ? "bg-gradient-to-br from-primary/40 to-primary-glow/40"
        : "bg-gradient-primary"
    }`}>
      {/* Ambient background */}
      <div className="absolute inset-0 bg-gradient-ethereal opacity-30" />

      <div className="relative z-10 flex flex-col h-full p-6 max-w-md mx-auto w-full">
        {/* Interval Progress */}
        <div className="py-8 text-center">
          <p className="text-muted-foreground mb-2">Interval</p>
          <h1 className="text-4xl font-light text-foreground">
            {currentInterval} of {config.intervalCount}
          </h1>
        </div>

        {/* Main Timer Display */}
        <div className="flex-1 flex flex-col items-center justify-center space-y-12">
          {/* Phase Indicator */}
          <div className="text-center">
            <div className={`text-6xl font-light mb-4 ${
              currentPhase === "work" ? "text-accent" : "text-primary"
            }`}>
              {currentPhase === "work" ? "WORK" : currentPhase === "recover" ? "RECOVER" : "DONE"}
            </div>
            
            {/* Timer */}
            <div className="text-5xl font-light text-foreground mb-2">
              {formatTime(timeRemaining)}
            </div>
            
            <p className="text-muted-foreground text-lg">
              {currentPhase === "work" ? "remaining" : currentPhase === "recover" ? "recovery" : "complete"}
            </p>
          </div>

          {/* Progress Bar */}
          {currentPhase !== "complete" && (
            <div className="w-full max-w-xs">
              <div className="w-full bg-white/10 rounded-full h-3 backdrop-blur-sm border border-white/20">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${
                    currentPhase === "work" ? "bg-accent" : "bg-primary"
                  }`}
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>
            </div>
          )}

          {/* Next Phase Preview */}
          {currentPhase !== "complete" && (
            <Card className="p-4 bg-white/5 backdrop-blur-md border-white/20 text-center">
              <p className="text-sm text-muted-foreground">
                Next: {currentPhase === "work" 
                  ? "Recovery" 
                  : currentInterval < config.intervalCount 
                    ? "Work" 
                    : "Session Complete"
                }
              </p>
            </Card>
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
                  <Pause className="w-8 h-8 mr-3" />
                ) : (
                  <Play className="w-8 h-8 mr-3" />
                )}
                {isRunning ? "Pause" : "Start"}
              </GlassButton>

              {/* Secondary Controls */}
              <div className="flex gap-3">
                <GlassButton
                  variant="glass"
                  size="lg"
                  onClick={handleReset}
                  className="flex-1"
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Reset
                </GlassButton>
                <GlassButton
                  variant="glass"
                  size="lg"
                  onClick={handleStop}
                  className="flex-1"
                >
                  <Square className="w-5 h-5 mr-2" />
                  Exit
                </GlassButton>
              </div>
            </>
          ) : (
            /* Session Complete */
            <div className="space-y-4 text-center">
              <div className="py-6">
                <h2 className="text-3xl font-light text-foreground mb-4">
                  Session Complete!
                </h2>
                <p className="text-muted-foreground text-lg">
                  {config.intervalCount} intervals finished
                </p>
              </div>
              
              <GlassButton
                variant="ethereal"
                size="xl"
                onClick={handleReset}
                className="w-full"
              >
                New Session
              </GlassButton>
              
              <GlassButton
                variant="glass"
                size="lg"
                onClick={handleStop}
                className="w-full"
              >
                Back to Setup
              </GlassButton>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}