import { useState, useRef, useCallback } from 'react'

interface GPSPosition {
  lat: number
  lng: number
  accuracy: number
  timestamp: number
}

interface UseGPSTrackingProps {
  onDistanceUpdate: (distance: number, intervalDistance: number) => void
  onError: (error: string) => void
}

export const useGPSTracking = ({ onDistanceUpdate, onError }: UseGPSTrackingProps) => {
  const [isTracking, setIsTracking] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [accuracy, setAccuracy] = useState<number | null>(null)
  
  const watchIdRef = useRef<number | null>(null)
  const lastPositionRef = useRef<GPSPosition | null>(null)
  const totalDistanceRef = useRef(0)
  const intervalDistanceRef = useRef(0)

  // Calculate distance between two GPS coordinates using Haversine formula
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000 // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }, [])

  // Request location permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const result = await navigator.permissions.query({ name: 'geolocation' })
      const granted = result.state === 'granted'
      setHasPermission(granted)
      return granted
    } catch (error) {
      setHasPermission(false)
      return false
    }
  }, [])

  // Start GPS tracking
  const startTracking = useCallback(async (): Promise<boolean> => {
    if (!navigator.geolocation) {
      onError('GPS not supported by this device')
      return false
    }

    const permission = await requestPermission()
    if (!permission) {
      onError('GPS permission denied')
      return false
    }

    try {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const newPosition: GPSPosition = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now()
          }

          setAccuracy(position.coords.accuracy)

          if (lastPositionRef.current) {
            const distance = calculateDistance(
              lastPositionRef.current.lat,
              lastPositionRef.current.lng,
              newPosition.lat,
              newPosition.lng
            )

            // Only count significant movements (filter out GPS noise)
            if (distance > 2 && position.coords.accuracy < 50) {
              totalDistanceRef.current += distance
              intervalDistanceRef.current += distance
              
              onDistanceUpdate(totalDistanceRef.current, intervalDistanceRef.current)
            }
          }

          lastPositionRef.current = newPosition
        },
        (error) => {
          console.error('GPS error:', error)
          onError(`GPS error: ${error.message}`)
          setIsTracking(false)
        },
        {
          enableHighAccuracy: true,
          maximumAge: 1000,
          timeout: 10000
        }
      )

      setIsTracking(true)
      return true
    } catch (error) {
      onError('Failed to start GPS tracking')
      return false
    }
  }, [calculateDistance, onDistanceUpdate, onError, requestPermission])

  // Stop GPS tracking
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    setIsTracking(false)
    setAccuracy(null)
  }, [])

  // Reset distance counters
  const resetDistance = useCallback(() => {
    totalDistanceRef.current = 0
    intervalDistanceRef.current = 0
    lastPositionRef.current = null
  }, [])

  // Reset interval distance (for new interval)
  const resetIntervalDistance = useCallback(() => {
    intervalDistanceRef.current = 0
  }, [])

  // Format distance for display
  const formatDistance = useCallback((meters: number): string => {
    if (meters < 1000) return Math.round(meters) + 'm'
    return (meters / 1000).toFixed(1) + 'km'
  }, [])

  return {
    isTracking,
    hasPermission,
    accuracy,
    startTracking,
    stopTracking,
    resetDistance,
    resetIntervalDistance,
    formatDistance,
    totalDistance: totalDistanceRef.current,
    intervalDistance: intervalDistanceRef.current
  }
}