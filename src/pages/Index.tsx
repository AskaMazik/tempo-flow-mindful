import { useState } from "react"
import Setup, { IntervalConfig } from "./Setup"
import Running from "./Running"
import Countdown from "./Countdown"
import Complete from "./Complete"

const Index = () => {
  const [currentView, setCurrentView] = useState<"setup" | "running">("setup")
  const [intervalConfig, setIntervalConfig] = useState<IntervalConfig | null>(null)

  const handleStartSession = (config: IntervalConfig) => {
    setIntervalConfig(config)
    setCurrentView("running")
  }

  const handleResetToSetup = () => {
    setCurrentView("setup")
    setIntervalConfig(null)
  }

  if (currentView === "running" && intervalConfig) {
    return <Running config={intervalConfig} onReset={handleResetToSetup} />
  }

  return <Setup onStart={handleStartSession} />
};

export default Index;
