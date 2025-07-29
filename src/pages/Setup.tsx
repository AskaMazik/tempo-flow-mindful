import { useState } from "react"
import { GlassButton } from "@/components/ui/glass-button"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Timer, MapPin, Volume2, VolumeX } from "lucide-react"

interface SetupProps {
  onStart: (config: IntervalConfig) => void
}

export interface IntervalConfig {
  intervalCount: number
  isTimeBased: boolean
  workDuration: number // minutes or meters
  restDuration: number // minutes or meters
  audioEnabled: boolean
}

export default function Setup({ onStart }: SetupProps) {
  const [intervalCount, setIntervalCount] = useState([5])
  const [isTimeBased, setIsTimeBased] = useState(true)
  const [workDuration, setWorkDuration] = useState([2]) // 2 minutes or 400m
  const [restDuration, setRestDuration] = useState([1]) // 1 minute or 200m
  const [audioEnabled, setAudioEnabled] = useState(true)

  const handleStart = () => {
    const config: IntervalConfig = {
      intervalCount: intervalCount[0],
      isTimeBased,
      workDuration: workDuration[0],
      restDuration: restDuration[0],
      audioEnabled
    }
    onStart(config)
  }

  const totalTime = isTimeBased 
    ? (workDuration[0] + restDuration[0]) * intervalCount[0]
    : Math.round(((workDuration[0] + restDuration[0]) * intervalCount[0]) / 200) // rough estimate

  return (
    <div className="min-h-screen bg-gradient-primary flex flex-col p-6 relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 bg-gradient-ethereal opacity-30" />
      <div className="absolute top-1/3 right-1/4 w-40 h-40 bg-gradient-breath rounded-full blur-3xl opacity-20 animate-float" />

      <div className="relative z-10 flex flex-col h-full max-w-md mx-auto w-full">
        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-4xl font-light text-foreground tracking-wide mb-2">
            RHYTHM
          </h1>
          <p className="text-muted-foreground text-lg">
            Pure Interval Running
          </p>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {/* Interval Count */}
          <Card className="p-6 bg-white/5 backdrop-blur-md border-white/20">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-foreground font-light text-lg">
                  Intervals
                </Label>
                <span className="text-foreground font-medium text-xl">
                  {intervalCount[0]}
                </span>
              </div>
              <Slider
                value={intervalCount}
                onValueChange={setIntervalCount}
                max={20}
                min={1}
                step={1}
                className="w-full"
              />
            </div>
          </Card>

          {/* Time vs Distance Toggle */}
          <Card className="p-6 bg-white/5 backdrop-blur-md border-white/20">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {isTimeBased ? (
                    <Timer className="w-5 h-5 text-primary" />
                  ) : (
                    <MapPin className="w-5 h-5 text-accent" />
                  )}
                  <Label className="text-foreground font-light text-lg">
                    {isTimeBased ? "Time-Based" : "Distance-Based"}
                  </Label>
                </div>
                <Switch 
                  checked={isTimeBased} 
                  onCheckedChange={setIsTimeBased}
                />
              </div>
            </div>
          </Card>

          {/* Work Duration */}
          <Card className="p-6 bg-white/5 backdrop-blur-md border-white/20">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-accent font-light text-lg">
                  Work {isTimeBased ? "Time" : "Distance"}
                </Label>
                <span className="text-accent font-medium text-xl">
                  {isTimeBased 
                    ? `${workDuration[0]}m`
                    : `${workDuration[0]}m`
                  }
                </span>
              </div>
              <Slider
                value={workDuration}
                onValueChange={setWorkDuration}
                max={isTimeBased ? 10 : 2000}
                min={isTimeBased ? 0.5 : 100}
                step={isTimeBased ? 0.5 : 100}
                className="w-full"
              />
            </div>
          </Card>

          {/* Rest Duration */}
          <Card className="p-6 bg-white/5 backdrop-blur-md border-white/20">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-primary font-light text-lg">
                  Recovery {isTimeBased ? "Time" : "Distance"}
                </Label>
                <span className="text-primary font-medium text-xl">
                  {isTimeBased 
                    ? `${restDuration[0]}m`
                    : `${restDuration[0]}m`
                  }
                </span>
              </div>
              <Slider
                value={restDuration}
                onValueChange={setRestDuration}
                max={isTimeBased ? 5 : 1000}
                min={isTimeBased ? 0.5 : 50}
                step={isTimeBased ? 0.5 : 50}
                className="w-full"
              />
            </div>
          </Card>

          {/* Audio Toggle */}
          <Card className="p-6 bg-white/5 backdrop-blur-md border-white/20">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {audioEnabled ? (
                    <Volume2 className="w-5 h-5 text-foreground" />
                  ) : (
                    <VolumeX className="w-5 h-5 text-muted-foreground" />
                  )}
                  <Label className="text-foreground font-light text-lg">
                    Audio Cues
                  </Label>
                </div>
                <Switch 
                  checked={audioEnabled} 
                  onCheckedChange={setAudioEnabled}
                />
              </div>
            </div>
          </Card>

          {/* Session Summary */}
          <Card className="p-4 bg-gradient-ethereal backdrop-blur-sm border-primary/30">
            <div className="text-center space-y-2">
              <p className="text-muted-foreground">Total Session</p>
              <p className="text-2xl font-light text-foreground">
                ~{totalTime} minutes
              </p>
            </div>
          </Card>
        </div>

        {/* Start Button */}
        <div className="py-6">
          <GlassButton 
            variant="ethereal" 
            size="xl" 
            className="w-full"
            onClick={handleStart}
          >
            Start Interval Run
          </GlassButton>
        </div>
      </div>
    </div>
  )
}