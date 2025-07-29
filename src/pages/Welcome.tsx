import { useState } from "react"
import { GlassButton } from "@/components/ui/glass-button"
import { BreathingCircle } from "@/components/ui/breathing-circle"
import { Card } from "@/components/ui/card"

export default function Welcome() {
  const [intention, setIntention] = useState("")
  const [showIntention, setShowIntention] = useState(false)

  const handleStart = () => {
    if (!showIntention) {
      setShowIntention(true)
    } else {
      // Navigate to interval setup
      console.log("Navigate to setup with intention:", intention)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-primary flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Ambient background elements */}
      <div className="absolute inset-0 bg-gradient-ethereal opacity-50" />
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-breath rounded-full blur-3xl opacity-30 animate-float" />
      <div className="absolute bottom-1/3 right-1/3 w-24 h-24 bg-gradient-breath rounded-full blur-2xl opacity-20 animate-float" style={{ animationDelay: "2s" }} />

      <div className="relative z-10 flex flex-col items-center text-center max-w-md w-full space-y-8">
        {/* App Title */}
        <div className="space-y-2 animate-fade-in-up">
          <h1 className="text-5xl font-light text-foreground tracking-wide">
            RHYTHM
          </h1>
          <p className="text-muted-foreground text-lg font-light">
            Find balance with mindful<br />
            interval running and meditation.
          </p>
        </div>

        {/* Breathing Circle */}
        <div className="py-8" style={{ animationDelay: "0.3s" } as React.CSSProperties}>
          <BreathingCircle 
            isActive={true} 
            phase="prepare" 
            size="lg"
            className="animate-fade-in-up"
          />
        </div>

        {/* Intention Setting or Action Buttons */}
        {!showIntention ? (
          <div className="space-y-4 w-full animate-fade-in-up" style={{ animationDelay: "0.6s" } as React.CSSProperties}>
            <GlassButton 
              variant="ethereal" 
              size="lg" 
              onClick={handleStart}
              className="w-full"
            >
              Begin Your Practice
            </GlassButton>
            
            <p className="text-sm text-muted-foreground">
              Take a moment to center yourself
            </p>
          </div>
        ) : (
          <Card className="w-full p-6 bg-white/5 backdrop-blur-md border-white/20 animate-fade-in-up">
            <div className="space-y-4">
              <h3 className="text-lg font-light text-foreground text-center">
                Set Your Intention
              </h3>
              <p className="text-sm text-muted-foreground text-center">
                What do you want to cultivate in today's practice?
              </p>
              
              <textarea
                value={intention}
                onChange={(e) => setIntention(e.target.value)}
                placeholder="I intend to..."
                className="w-full h-24 bg-transparent border border-white/20 rounded-lg p-3 text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              
              <div className="flex gap-3">
                <GlassButton 
                  variant="glass" 
                  size="md"
                  onClick={() => setShowIntention(false)}
                  className="flex-1"
                >
                  Back
                </GlassButton>
                <GlassButton 
                  variant="ethereal" 
                  size="md"
                  onClick={handleStart}
                  className="flex-1"
                  disabled={!intention.trim()}
                >
                  Continue
                </GlassButton>
              </div>
            </div>
          </Card>
        )}

        {/* Bottom hint */}
        <div className="absolute bottom-8 text-center animate-fade-in-up" style={{ animationDelay: "1s" } as React.CSSProperties}>
          <p className="text-xs text-muted-foreground">
            Breathe deeply and find your rhythm
          </p>
        </div>
      </div>
    </div>
  )
}