import { useState, useEffect, useRef, useCallback } from "react"
import { GlassButton } from "@/components/ui/glass-button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Play, Pause, Square, RotateCcw, Zap, ZapOff, Volume2, VolumeX } from "lucide-react"
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
  const [gpsPermission, setGpsPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt')
  const [audioPermission, setAudioPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt')
  const audioContextRef = useRef<AudioContext | null>(null)
  const [audioInitialized, setAudioInitialized] = useState(false)

  // Use refs to avoid stale closures in timer
  const currentPhaseRef = useRef(currentPhase)
  const currentIntervalRef = useRef(currentInterval)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Update refs when state changes
  useEffect(() => {
    currentPhaseRef.current = currentPhase
  }, [currentPhase])

  useEffect(() => {
    currentIntervalRef.current = currentInterval
  }, [currentInterval])

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
      setGpsPermission('denied')
    }
  })

  // EXPLICIT GPS PERMISSION REQUEST
  const requestGPSPermission = useCallback(async (): Promise<boolean> => {
    if (!navigator.geolocation) {
      setGpsError("GPS not supported")
      setGpsPermission('denied')
      return false
    }

    try {
      // First check existing permission status
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'geolocation' })
        if (permission.state === 'granted') {
          setGpsPermission('granted')
          setGpsError(null)
          return true
        } else if (permission.state === 'denied') {
          setGpsPermission('denied')
          setGpsError("Location access denied. Enable in browser settings.")
          return false
        }
      }

      // Request permission by calling getCurrentPosition
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log('GPS permission granted:', position)
            setGpsPermission('granted')
            setGpsError(null)
            resolve(true)
          },
          (error) => {
            console.log('GPS permission denied:', error)
            setGpsPermission('denied')
            switch (error.code) {
              case error.PERMISSION_DENIED:
                setGpsError("Location access denied. Check browser settings.")
                break
              case error.POSITION_UNAVAILABLE:
                setGpsError("Location unavailable. Try moving outdoors.")
                break
              case error.TIMEOUT:
                setGpsError("Location request timed out. Try again.")
                break
              default:
                setGpsError("Location error. Please try again.")
                break
            }
            resolve(false)
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          }
        )
      })
    } catch (error) {
      console.log('GPS permission error:', error)
      setGpsPermission('denied')
      setGpsError("Could not request location permission")
      return false
    }
  }, [])

  // EXPLICIT AUDIO PERMISSION REQUEST
  const requestAudioPermission = useCallback(async (): Promise<boolean> => {
    if (!config.audioEnabled) return true

    try {
      // Create or resume audio context
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }

      // For mobile browsers, audio context starts suspended
      if (audioContextRef.current.state === 'suspended') {
        console.log('Resuming suspended audio context...')
        await audioContextRef.current.resume()
      }

      if (audioContextRef.current.state === 'running') {
        console.log('Audio permission granted')
        setAudioPermission('granted')
        setAudioInitialized(true)
        
        // Test audio with a quick beep
        const oscillator = audioContextRef.current.createOscillator()
        const gainNode = audioContextRef.current.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContextRef.current.destination)
        
        oscillator.frequency.setValueAtTime(800, audioContextRef.current.currentTime)
        oscillator.type = 'sine'
        
        gainNode.gain.setValueAtTime(0, audioContextRef.current.currentTime)
        gainNode.gain.linearRampToValueAtTime(0.05, audioContextRef.current.currentTime + 0.1)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.3)
        
        oscillator.start(audioContextRef.current.currentTime)
        oscillator.stop(audioContextRef.current.currentTime + 0.3)
        
        return true
      } else {
        console.log('Audio context not running, state:', audioContextRef.current.state)
        setAudioPermission('denied')
        return false
      }
    } catch (error) {
      console.log('Audio permission error:', error)
      setAudioPermission('denied')
      return false
    }
  }, [config.audioEnabled])

  // VIBRATION FALLBACK for mobile
  const triggerVibration = useCallback((pattern: number[] = [100]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  }, [])

  // Enhanced audio chime with fallback
  const playChime = useCallback(async (frequency: number = 800) => {
    if (!config.audioEnabled) return

    try {
      if (audioPermission !== 'granted' || !audioInitialized || !audioContextRef.current) {
        console.log('Audio not ready, using vibration fallback')
        // Fallback to vibration
        if (frequency === 600) triggerVibration([100]) // Recovery
        else if (frequency === 800) triggerVibration([100, 50, 100]) // Work
        else triggerVibration([200, 100, 200, 100, 200]) // Complete
        return
      }

      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume()
      }

      if (audioContextRef.current.state !== 'running') {
        console.log('Audio context not running, using vibration')
        triggerVibration([100])
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
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.5)
      
      oscillator.start(audioContextRef.current.currentTime)
      oscillator.stop(audioContextRef.current.currentTime + 0.5)
      
      console.log('Audio chime played successfully')
    } catch (error) {
      console.log('Audio playback failed, using vibration:', error)
      triggerVibration([100])
    }
  }, [config.audioEnabled, audioPermission, audioInitialized, triggerVibration])

  // Phase transition handler
  const handlePhaseTransition = useCallback(() => {
    console.log('=== PHASE TRANSITION START ===')
    console.log('Current phase:', currentPhaseRef.current)
    console.log('Current interval:', currentIntervalRef.current)
    
    if (currentPhaseRef.current === "work") {
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
    } else if (currentPhaseRef.current === "recover") {
      if (currentIntervalRef.current < config.intervalCount) {
        console.log('Transitioning: recovery -> work, interval:', currentIntervalRef.current + 1)
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
        console.log('Session complete!')
        playChime(1000)
        setCurrentPhase("complete")
        setIsRunning(false)
        gps.stopTracking()
      }
    }
    console.log('=== PHASE TRANSITION END ===')
  }, [config, playChime, gps])

  // Handle distance-based phase transitions
  useEffect(() => {
    if (!config.isTimeBased && isRunning && distanceRemaining <= 0) {
      handlePhaseTransition()
    }
  }, [config.isTimeBased, isRunning, distanceRemaining, handlePhaseTransition])

  // Timer effect
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    if (isRunning && config.isTimeBased && currentPhase !== "complete") {
      console.log('Starting timer for phase:', currentPhase, 'with time:', timeRemaining)
      
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          console.log('Timer tick - remaining:', prev)
          
          if (prev <= 1) {
            console.log('Timer reached 0 - triggering phase transition')
            if (timerRef.current) {
              clearInterval(timerRef.current)
              timerRef.current = null
            }
            setTimeout(() => {
              handlePhaseTransition()
            }, 0)
            return 0
          }
          
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isRunning, currentPhase, config.isTimeBased])

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  // Auto-request GPS permission when needed
  useEffect(() => {
    if (!config.isTimeBased && gpsPermission === 'prompt') {
      requestGPSPermission()
    }
  }, [config.isTimeBased, gpsPermission, requestGPSPermission])

  // Start GPS tracking when permission granted
  useEffect(() => {
    if (!config.isTimeBased && isRunning && gpsPermission === 'granted') {
      gps.startTracking()
    } else {
      gps.stopTracking()
    }
    return () => gps.stopTracking()
  }, [config.isTimeBased, isRunning, gpsPermission, gps])

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
    // Request permissions on first interaction
    if (config.audioEnabled && audioPermission === 'prompt') {
      await requestAudioPermission()
    }
    
    if (!config.isTimeBased && gpsPermission === 'prompt') {
      const granted = await requestGPSPermission()
      if (!granted) {
        // Don't start if GPS is required but denied
        return
      }
    }
    
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
      <div className="absolute inset-0 bg-gradient-glass opacity-30" />
      <div 
        className="absolute top-1/4 left-1/3 w-64 h-64 rounded-full blur-3xl opacity-20 animate-pulse transition-all duration-1000"
        style={{
          background: currentPhase === "work" ? 'hsl(var(--accent))' : 'hsl(var(--primary))'
        }}
      />

      <div className="running-container">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="mb-4">
            <p className="text-white/70 text-lg font-light mb-2">Interval</p>
            <h1 className="interval-count text-white">
              {currentInterval} of {config.intervalCount}
            </h1>
          </div>

          <div className="phase-display text-white/80 uppercase">
            {currentPhase === "work" ? "FAST PACE" : currentPhase === "recover" ? "EASY PACE" : "COMPLETE"}
          </div>
          
          <div className="countdown-time text-white">
            {config.isTimeBased ? formatTime(timeRemaining) : formatDistance(distanceRemaining)}
          </div>
          
          <p className="text-white/60 text-base font-light mb-6">remaining</p>

          {currentPhase !== "complete" && (
            <div className="w-full max-w-sm mb-6">
              <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden mb-4">
                <div 
                  className="h-full bg-white/70 transition-all duration-1000 ease-out rounded-full"
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>
              
              <div className="inline-block px-6 py-2 bg-white/15 rounded-full border border-white/25 backdrop-blur-md">
                <span className="text-white/90 text-sm font-light">
                  Next: {currentPhase === "work" ? "Easy Pace" : "Fast Pace"}
                </span>
              </div>

              {/* Permission Status Display */}
              <div className="flex items-center justify-center gap-4 mt-3">
                {/* Audio Status */}
                {config.audioEnabled && (
                  <div className="flex items-center gap-1">
                    {audioPermission === 'granted' ? (
                      <Volume2 className="w-3 h-3 text-green-400" />
                    ) : (
                      <VolumeX className="w-3 h-3 text-red-400" />
                    )}
                    <span className="text-xs text-white/60">
                      {audioPermission === 'granted' ? 'Audio' : 'No Audio'}
                    </span>
                  </div>
                )}

                {/* GPS Status */}
                {!config.isTimeBased && (
                  <div className="flex items-center gap-1">
                    {gpsPermission === 'granted' && gps.isTracking ? (
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
              </div>

              {gpsError && (
                <div className="text-yellow-400 text-xs text-center mt-2">
                  {gpsError}
                </div>
              )}

              {/* Permission Request Buttons */}
              {(audioPermission === 'denied' || gpsPermission === 'denied') && (
                <div className="flex gap-2 mt-3">
                  {config.audioEnabled && audioPermission === 'denied' && (
                    <button
                      onClick={requestAudioPermission}
                      className="flex-1 px-3 py-1 bg-yellow-500/20 border border-yellow-500/40 rounded-lg text-xs text-yellow-300"
                    >
                      Enable Audio
                    </button>
                  )}
                  {!config.isTimeBased && gpsPermission === 'denied' && (
                    <button
                      onClick={requestGPSPermission}
                      className="flex-1 px-3 py-1 bg-yellow-500/20 border border-yellow-500/40 rounded-lg text-xs text-yellow-300"
                    >
                      Enable GPS
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="w-full max-w-sm space-y-3 mt-8">
          {currentPhase !== "complete" ? (
            <>
              <GlassButton
                variant="primary"
                size="xl"
                onClick={handlePlayPause}
                className="w-full text-lg py-4 rounded-full"
              >
                ▶ {isRunning ? "Pause" : "Resume"}
              </GlassButton>

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