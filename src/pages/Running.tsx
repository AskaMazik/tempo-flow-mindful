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
        {/* Interval Progress */}
        <div className="py-8 text-center">
          <p className="text-muted-foreground mb-2">Interval</p>
          <h1 className="text-4xl font-light text-foreground">
            {currentInterval} of {config.intervalCount}
          </h1>
        </div>

        {/* Main Timer Display */}
        <div className="flex-1 flex flex-col items-center justify-center space-y-12">
          {/* Phase Indicator with Circular Progress */}
          <Card className="p-8 backdrop-blur-md border-0 text-center" style={{background: 'var(--glass-bg)', boxShadow: 'var(--glass-shadow)'}}>
            <div 
              className="text-6xl font-bold mb-4 animate-pulse transition-colors duration-1000"
              style={{
                color: currentPhase === "work" ? 'hsl(var(--accent))' : 'hsl(var(--primary))',
                textShadow: currentPhase === "work" 
                  ? '0 0 40px hsl(var(--accent) / 0.5)' 
                  : '0 0 40px hsl(var(--primary) / 0.5)'
              }}
            >
              {currentPhase === "work" ? "FAST PACE" : currentPhase === "recover" ? "EASY PACE" : "DONE"}
            </div>
            
            {/* Circular Progress Container */}
            <div className="relative w-40 h-40 mx-auto mb-6">
              <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 144 144">
                <circle cx="72" cy="72" r="64" stroke="hsl(var(--foreground) / 0.1)" strokeWidth="8" fill="none" />
                <circle
                  cx="72" cy="72" r="64"
                  stroke={currentPhase === "work" ? 'hsl(var(--accent))' : 'hsl(var(--primary))'}
                  strokeWidth="8" fill="none" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 64}`}
                  strokeDashoffset={`${2 * Math.PI * 64 * (1 - getProgressPercentage() / 100)}`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div 
                  className="text-4xl font-bold animate-pulse transition-colors duration-1000"
                  style={{color: currentPhase === "work" ? 'hsl(var(--accent))' : 'hsl(var(--primary))'}}
                >
                  {formatTime(timeRemaining)}
                </div>
              </div>
            </div>
          </Card>

          {/* Session Progress */}
          {currentPhase !== "complete" && (
            <Card className="p-4 backdrop-blur-md border-0" style={{background: 'var(--glass-bg)', boxShadow: 'var(--glass-shadow)'}}>
              <div className="space-y-3">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Session Progress</span>
                  <span>{Math.round((currentInterval - 1 + (currentPhase === "recover" ? 1 : 0)) / config.intervalCount * 100)}%</span>
                </div>
                <Progress value={(currentInterval - 1 + (currentPhase === "recover" ? 1 : 0)) / config.intervalCount * 100} className="h-2" />
              </div>
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