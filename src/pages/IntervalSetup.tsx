import { useState } from "react"
import { GlassButton } from "@/components/ui/glass-button"
import { BreathingCircle } from "@/components/ui/breathing-circle"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Timer, MapPin } from "lucide-react"

export default function IntervalSetup() {
  const [isTimeBased, setIsTimeBased] = useState(true)
  const [workDuration, setWorkDuration] = useState([2]) // minutes
  const [restDuration, setRestDuration] = useState([1]) // minutes
  const [intervals, setIntervals] = useState([5])
  const [workDistance, setWorkDistance] = useState([400]) // meters
  const [restDistance, setRestDistance] = useState([200]) // meters

  const totalTime = isTimeBased 
    ? (workDuration[0] + restDuration[0]) * intervals[0]
    : Math.round(((workDistance[0] + restDistance[0]) * intervals[0]) / 200) // rough estimate

  return (
    <div className="min-h-screen bg-gradient-primary flex flex-col p-6 relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 bg-gradient-ethereal opacity-30" />
      <div className="absolute top-1/3 right-1/4 w-40 h-40 bg-gradient-breath rounded-full blur-3xl opacity-20 animate-float" />

      <div className="relative z-10 flex flex-col h-full max-w-md mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between py-6">
          <button className="p-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-xl font-light text-foreground">Build Your Flow</h1>
          <div className="w-9" /> {/* Spacer */}
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-8">
          {/* Breathing Guide */}
          <div className="flex justify-center py-4">
            <BreathingCircle isActive={true} phase="prepare" size="md" />
          </div>

          {/* Interval Type Toggle */}
          <Card className="p-6 bg-white/5 backdrop-blur-md border-white/20">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {isTimeBased ? (
                    <Timer className="w-5 h-5 text-primary" />
                  ) : (
                    <MapPin className="w-5 h-5 text-accent" />
                  )}
                  <Label className="text-foreground font-light">
                    {isTimeBased ? "Time-Based" : "Distance-Based"}
                  </Label>
                </div>
                <Switch 
                  checked={isTimeBased} 
                  onCheckedChange={setIsTimeBased}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {isTimeBased 
                  ? "Focus on time intervals for consistent pacing" 
                  : "Focus on distance for speed development"
                }
              </p>
            </div>
          </Card>

          {/* Interval Configuration */}
          <Card className="p-6 bg-white/5 backdrop-blur-md border-white/20">
            <div className="space-y-6">
              <h3 className="text-lg font-light text-foreground text-center">
                Interval Structure
              </h3>

              {/* Work Phase */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-accent font-light">
                    Work {isTimeBased ? "Duration" : "Distance"}
                  </Label>
                  <span className="text-accent font-medium">
                    {isTimeBased 
                      ? `${workDuration[0]}m`
                      : `${workDistance[0]}m`
                    }
                  </span>
                </div>
                <Slider
                  value={isTimeBased ? workDuration : workDistance}
                  onValueChange={isTimeBased ? setWorkDuration : setWorkDistance}
                  max={isTimeBased ? 10 : 2000}
                  min={isTimeBased ? 0.5 : 100}
                  step={isTimeBased ? 0.5 : 50}
                  className="w-full"
                />
              </div>

              {/* Rest Phase */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-primary font-light">
                    Rest {isTimeBased ? "Duration" : "Distance"}
                  </Label>
                  <span className="text-primary font-medium">
                    {isTimeBased 
                      ? `${restDuration[0]}m`
                      : `${restDistance[0]}m`
                    }
                  </span>
                </div>
                <Slider
                  value={isTimeBased ? restDuration : restDistance}
                  onValueChange={isTimeBased ? setRestDuration : setRestDistance}
                  max={isTimeBased ? 5 : 1000}
                  min={isTimeBased ? 0.5 : 50}
                  step={isTimeBased ? 0.5 : 50}
                  className="w-full"
                />
              </div>

              {/* Number of Intervals */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-foreground font-light">
                    Intervals
                  </Label>
                  <span className="text-foreground font-medium">
                    {intervals[0]}
                  </span>
                </div>
                <Slider
                  value={intervals}
                  onValueChange={setIntervals}
                  max={20}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          </Card>

          {/* Session Summary */}
          <Card className="p-4 bg-gradient-ethereal backdrop-blur-sm border-primary/30">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">Estimated Session</p>
              <p className="text-2xl font-light text-foreground">
                {totalTime} minutes
              </p>
              <p className="text-xs text-muted-foreground">
                Find your rhythm in the flow
              </p>
            </div>
          </Card>
        </div>

        {/* Start Button */}
        <div className="py-6">
          <GlassButton 
            variant="ethereal" 
            size="lg" 
            className="w-full"
          >
            Begin Interval Flow
          </GlassButton>
        </div>
      </div>
    </div>
  )
}