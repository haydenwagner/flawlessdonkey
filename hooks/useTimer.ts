import { useState, useRef } from "react"

export function useTimer() {
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const startTimeRef = useRef<number | null>(null)

  const start = () => {
    startTimeRef.current = Date.now()
    setRunning(true)
  }

  const stop = () => {
    if (!startTimeRef.current) return
    const duration = Date.now() - startTimeRef.current
    setElapsed(duration)
    setRunning(false)
    return duration
  }

  const reset = () => {
    setElapsed(0)
    setRunning(false)
    startTimeRef.current = null
  }

  return { running, elapsed, start, stop, reset }
}
