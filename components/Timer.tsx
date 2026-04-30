"use client"

import { useTimer } from "../hooks/useTimer"

export default function Timer() {
  const { running, elapsed, start, stop } = useTimer()

  return (
    <div>
      <h2>{elapsed} ms</h2>

      {!running ? (
        <button onClick={start}>Start</button>
      ) : (
        <button onClick={stop}>Stop</button>
      )}
    </div>
  )
}
