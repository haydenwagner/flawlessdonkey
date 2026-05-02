import { useState, useRef, useEffect } from "react"

export function useTimer() {
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [pausedElapsed, setPausedElapsed] = useState(0)
  const startTimeRef = useRef<number | null>(null)

  const start = () => {
    const now = Date.now()
    if (pausedElapsed > 0) {
      startTimeRef.current = now - pausedElapsed
    } else {
      startTimeRef.current = now
    }
    setRunning(true)
  }

  const stop = () => {
    if (!startTimeRef.current) return
    const duration = Date.now() - startTimeRef.current
    setElapsed(duration)
    setPausedElapsed(duration)
    setRunning(false)
    return duration
  }

  const reset = () => {
    if (running) {
      startTimeRef.current = Date.now()
      setElapsed(0)
      setPausedElapsed(0)
      // Keep running
    } else {
      setElapsed(0)
      setRunning(false)
      setPausedElapsed(0)
      startTimeRef.current = null
    }
  }

  useEffect(() => {
    if (!running) return

    const intervalId = setInterval(() => {
      if (startTimeRef.current) {
        const currentElapsed = Date.now() - startTimeRef.current
        setElapsed(currentElapsed)
      }
    }, 50) // Update every 50ms for smooth real-time display

    return () => clearInterval(intervalId)
  }, [running])

  return { running, elapsed, start, stop, reset }
}
