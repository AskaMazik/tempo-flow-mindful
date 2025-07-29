import { useState, useEffect, useRef } from "react"
import { GlassButton } from "@/components/ui/glass-button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Play, Pause, Square, RotateCcw } from "lucide-react"
import { IntervalConfig } from "./Setup"

type SessionPhase = "work" | "recover" | "complete"
type RunState = "ready" | "running" | "paused"

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
    <div 
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{background: 'linear-gradient(135deg, #9b59b6 0%, #5dade2 100%)'}}
    >
      {/* Glass morphism background */}
      <div className="absolute inset-0 bg-gradient-glass opacity-30" />
      <div 
        className="absolute top-1/4 left-1/3 w-64 h-64 rounded-full blur-3xl opacity-20 animate-pulse transition-all duration-1000"
        style={{
          background: currentPhase === "work" ? 'hsl(var(--accent))' : 'hsl(var(--primary))'
        }}
      />

      <div className="relative z-10 flex flex-col h-full p-6 max-w-md mx-auto w-full">
        {/* Minimalist Layout */}
        <div className="flex-1 flex flex-col items-center justify-center space-y-8 text-center">
          {/* Interval Progress */}
          <div className="space-y-4">
            <p className="text-white/70 text-lg">Interval</p>
            <h1 className="text-6xl font-light text-white">
              {currentInterval} of {config.intervalCount}
            </h1>
          </div>

          {/* Phase Indicator */}
          <div className="space-y-6">
            <h2 className="text-3xl font-light text-white/90 tracking-wider">
              {currentPhase === "work" ? "FAST PACE" : currentPhase === "recover" ? "EASY PACE" : "COMPLETE"}
            </h2>
            
            {/* Timer */}
            <div className="text-8xl font-light text-white">
              {formatTime(timeRemaining)}
            </div>
            <p className="text-white/60 text-lg">remaining</p>
          </div>

          {/* Progress Bar */}
          {currentPhase !== "complete" && (
            <div className="w-full max-w-xs space-y-4">
              <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white/60 transition-all duration-1000 ease-out"
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>
              
              {/* Next Phase Indicator */}
              <div className="inline-block px-4 py-2 bg-white/10 rounded-full border border-white/20 backdrop-blur-md">
                <span className="text-white/80 text-sm">
                  Next: {currentPhase === "work" ? "Easy Pace" : "Fast Pace"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="space-y-4 pb-6">
          {currentPhase !== "complete" ? (
            <>
              {/* Main Play/Pause */}
              <GlassButton
                variant="ethereal"
                size="xl"
                onClick={handlePlayPause}
                className="w-full text-xl py-4"
              >
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
                  Reset
                </GlassButton>
                <GlassButton
                  variant="glass"
                  size="lg"
                  onClick={handleStop}
                  className="flex-1"
                >
                  Exit
                </GlassButton>
              </div>
            </>
          ) : (
            /* Session Complete */
            <div className="space-y-4 text-center">
              <div className="py-6">
                <h2 className="text-4xl font-light text-white mb-4">
                  Well Done!
                </h2>
                <p className="text-white/70 text-lg">
                  {config.intervalCount} intervals completed
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