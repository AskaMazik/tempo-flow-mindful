import { useState, useEffect, useRef, useCallback } from "react"
import { GlassButton } from "@/components/ui/glass-button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Play, Pause, Square, RotateCcw, Zap, ZapOff } from "lucide-react"
import { IntervalConfig } from "./Setup"
import { useGPSTracking } from "@/hooks/useGPSTracking"

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
  const [distanceRemaining, setDistanceRemaining] = useState(
    config.isTimeBased ? 0 : config.workDuration
  )
  const [gpsError, setGpsError] = useState<string | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const [audioInitialized, setAudioInitialized] = useState(false)

  // GPS tracking hook
  const gps = useGPSTracking({
    onDistanceUpdate: (totalDistance, intervalDistance) => {
      if (!config.isTimeBased && isRunning) {
        const targetDistance = currentPhase === "work" ? config.workDuration : config.restDuration
        const remaining = Math.max(0, targetDistance - intervalDistance)
        setDistanceRemaining(remaining)
      }
    },
    onError: (error) => {
      setGpsError(error)
      // Fallback to time mode if GPS fails
      if (!config.isTimeBased) {
        console.log('GPS failed, continuing with time estimation')
      }
    }
  })


  // Start GPS tracking when distance-based mode starts
  useEffect(() => {
    if (!config.isTimeBased && isRunning && !gps.isTracking) {
      gps.startTracking().then(success => {
        if (!success) {
          setGpsError("Location access required for distance tracking")
        }
      })
    } else if (config.isTimeBased || !isRunning) {
      gps.stopTracking()
    }
    return () => gps.stopTracking()
  }, [config.isTimeBased, isRunning, gps])

  // Initialize audio context on first user interaction
  const initializeAudio = async () => {
    if (!config.audioEnabled) return false
    
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
      
      // Resume audio context if suspended (required on mobile)
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume()
      }
      
      // Test audio context is working
      if (audioContextRef.current.state === 'running') {
        setAudioInitialized(true)
        return true
      }
      
      return false
    } catch (error) {
      console.log("Audio initialization failed:", error)
      return false
    }
  }

  // Simple audio chime function
  const playChime = useCallback(async (frequency: number = 800) => {
    if (!config.audioEnabled) return
    
    try {
      // Ensure audio is initialized before playing
      if (!audioInitialized || !audioContextRef.current) {
        const success = await initializeAudio()
        if (!success) {
          console.log("Audio context initialization failed")
          return
        }
      }
      
      // Resume context if suspended (common on mobile)
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume()
      }
      
      if (!audioContextRef.current || audioContextRef.current.state !== 'running') {
        console.log("Audio context not ready, state:", audioContextRef.current?.state)
        return
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
      console.log("Audio playback failed:", error)
    }
  }, [config.audioEnabled, audioInitialized])

  // Phase transition handler
  const handlePhaseTransition = useCallback(() => {
    console.log('=== PHASE TRANSITION START ===')
    console.log('Current state - Phase:', currentPhase, 'Interval:', currentInterval, 'TimeRemaining:', timeRemaining)
    
    if (currentPhase === "work") {
      // Switch to recovery
      console.log('Transitioning: work -> recovery')
      playChime(600)
      setCurrentPhase("recover")
      const newTarget = config.isTimeBased ? config.restDuration * 60 : config.restDuration
      console.log('Setting recovery time to:', newTarget)
      setTimeRemaining(newTarget)
      setDistanceRemaining(newTarget)
      if (!config.isTimeBased) {
        gps.resetIntervalDistance()
      }
    } else if (currentPhase === "recover") {
      if (currentInterval < config.intervalCount) {
        // Switch to next work interval
        console.log('Transitioning: recovery -> work, interval:', currentInterval + 1)
        playChime(800)
        setCurrentInterval(prev => prev + 1)
        setCurrentPhase("work")
        const newTarget = config.isTimeBased ? config.workDuration * 60 : config.workDuration
        console.log('Setting work time to:', newTarget)
        setTimeRemaining(newTarget)
        setDistanceRemaining(newTarget)
        if (!config.isTimeBased) {
          gps.resetIntervalDistance()
        }
      } else {
        // Session complete
        console.log('Transitioning: recovery -> complete')
        playChime(1000)
        setCurrentPhase("complete")
        setIsRunning(false)
        gps.stopTracking()
      }
    }
    console.log('=== PHASE TRANSITION END ===')
  }, [currentPhase, currentInterval, config, playChime, gps, timeRemaining])

  // Handle distance-based phase transitions
  useEffect(() => {
    if (!config.isTimeBased && isRunning && distanceRemaining <= 0) {
      handlePhaseTransition()
    }
  }, [config.isTimeBased, isRunning, distanceRemaining, handlePhaseTransition])

  // Timer effect for time-based intervals
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isRunning && config.isTimeBased && currentPhase !== "complete") {
      console.log('Starting timer for phase:', currentPhase, 'with initial time:', timeRemaining)
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          console.log('Timer tick:', prev, 'Phase:', currentPhase)
          if (prev <= 1) {
            console.log('Timer reached 1, calling handlePhaseTransition')
            handlePhaseTransition()
            return prev // Keep the current value, handlePhaseTransition will set new value
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) {
        console.log('Clearing timer interval for phase:', currentPhase)
        clearInterval(interval)
      }
    }
  }, [isRunning, currentPhase, config.isTimeBased, handlePhaseTransition])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)}m`
    return `${(meters / 1000).toFixed(1)}km`
  }

  const getProgressPercentage = () => {
    if (config.isTimeBased) {
      const totalPhaseTime = currentPhase === "work" 
        ? config.workDuration * 60
        : config.restDuration * 60
      return ((totalPhaseTime - timeRemaining) / totalPhaseTime) * 100
    } else {
      const totalPhaseDistance = currentPhase === "work" 
        ? config.workDuration
        : config.restDuration
      return ((totalPhaseDistance - distanceRemaining) / totalPhaseDistance) * 100
    }
  }

  const handlePlayPause = async () => {
    // Initialize audio on first user interaction for mobile compatibility
    await initializeAudio()
    
    setIsRunning(!isRunning)
  }

  const handleReset = () => {
    setIsRunning(false)
    setCurrentPhase("work")
    setCurrentInterval(1)
    setTimeRemaining(config.isTimeBased ? config.workDuration * 60 : config.workDuration)
    setDistanceRemaining(config.isTimeBased ? 0 : config.workDuration)
    gps.resetDistance()
    setGpsError(null)
  }

  const handleStop = () => {
    setIsRunning(false)
    gps.stopTracking()
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

      <div className="running-container">
        {/* Compact centered layout */}
        <div className="flex flex-col items-center justify-center text-center">
          {/* Interval Progress */}
          <div className="mb-4">
            <p className="text-white/70 text-lg font-light mb-2">Interval</p>
            <h1 className="interval-count text-white">
              {currentInterval} of {config.intervalCount}
            </h1>
          </div>

          {/* Phase Indicator */}
          <div className="phase-display text-white/80 uppercase">
            {currentPhase === "work" ? "FAST PACE" : currentPhase === "recover" ? "EASY PACE" : "COMPLETE"}
          </div>
          
          {/* Countdown Timer */}
          <div className="countdown-time text-white">
            {config.isTimeBased ? formatTime(timeRemaining) : formatDistance(distanceRemaining)}
          </div>
          
          <p className="text-white/60 text-base font-light mb-6">remaining</p>

          {/* Progress Bar */}
          {currentPhase !== "complete" && (
            <div className="w-full max-w-sm mb-6">
              <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden mb-4">
                <div 
                  className="h-full bg-white/70 transition-all duration-1000 ease-out rounded-full"
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>
              
              {/* Next Phase Indicator */}
              <div className="inline-block px-6 py-2 bg-white/15 rounded-full border border-white/25 backdrop-blur-md">
                <span className="text-white/90 text-sm font-light">
                  Next: {currentPhase === "work" ? "Easy Pace" : "Fast Pace"}
                </span>
              </div>

              {/* GPS Status for distance mode */}
              {!config.isTimeBased && (
                <div className="flex items-center justify-center gap-2 mt-2">
                  {gps.isTracking ? (
                    <div className="flex items-center gap-1 text-green-400">
                      <Zap className="w-3 h-3" />
                      <span className="text-xs">GPS Active</span>
                      {gps.accuracy && (
                        <span className="text-xs text-white/60">
                          ±{Math.round(gps.accuracy)}m
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-red-400">
                      <ZapOff className="w-3 h-3" />
                      <span className="text-xs">No GPS</span>
                    </div>
                  )}
                </div>
              )}

              {gpsError && (
                <div className="text-yellow-400 text-xs text-center mt-2">
                  {gpsError}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Controls - Bottom Section */}
        <div className="w-full max-w-sm space-y-3 mt-8">
          {currentPhase !== "complete" ? (
            <>
              {/* Main Resume/Start Button */}
              <GlassButton
                variant="primary"
                size="xl"
                onClick={handlePlayPause}
                className="w-full text-lg py-4 rounded-full"
              >
                ▶ {isRunning ? "Pause" : "Resume"}
              </GlassButton>

              {/* Secondary Controls */}
              <div className="flex gap-3">
                <GlassButton
                  variant="glass"
                  size="lg"
                  onClick={handleReset}
                  className="flex-1 py-3 rounded-full text-sm"
                >
                  Reset
                </GlassButton>
                <GlassButton
                  variant="glass"
                  size="lg"
                  onClick={handleStop}
                  className="flex-1 py-3 rounded-full text-sm"
                >
                  Exit
                </GlassButton>
              </div>
            </>
          ) : (
            /* Session Complete */
            <div className="space-y-4 text-center">
              <div className="py-6">
                <h2 className="text-3xl font-light text-white mb-3">
                  Well Done!
                </h2>
                <p className="text-white/70 text-base">
                  {config.intervalCount} intervals completed
                </p>
              </div>
              
              <GlassButton
                variant="primary"
                size="xl"
                onClick={handleReset}
                className="w-full rounded-full"
              >
                New Session
              </GlassButton>
              
              <GlassButton
                variant="glass"
                size="lg"
                onClick={handleStop}
                className="w-full rounded-full"
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