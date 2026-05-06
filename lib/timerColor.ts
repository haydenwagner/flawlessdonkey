// Hue scale: red (0s) → green (20s) → blue (40s) → violet-purple (80s, capped)
const hueStops: [number, number][] = [
  [0, 0],
  [20, 120],
  [40, 240],
  [80, 270],
]

export function getTimerHue(seconds: number): number {
  if (seconds <= 0) return 0
  if (seconds >= 80) return 270
  for (let i = 0; i < hueStops.length - 1; i++) {
    const [t0, h0] = hueStops[i]
    const [t1, h1] = hueStops[i + 1]
    if (seconds <= t1) {
      return h0 + (h1 - h0) * ((seconds - t0) / (t1 - t0))
    }
  }
  return 270
}

// Lightness arc for the live timer animation (40–80s):
// rises from 58% through light blue → light purple (~70% peak at 60s),
// then darkens down to deep dark purple (38% at 80s).
export function getAnimLightness(seconds: number): number {
  if (seconds <= 40) return 58
  const t = Math.min((seconds - 40) / 40, 1)  // 0 at 40s → 1 at 80s
  return 58 + 22 * Math.sin(t * Math.PI) - 20 * t
  // t=0  → 58  (blue)
  // t=0.5 → 70  (light purple peak, ~60s)
  // t=1  → 38  (deep dark purple, ~80s)
}

// Discrete color brackets for time entry rows and stats.
// All pre-60s values are bright enough to read on the dark card background.
// 60s+ uses a fixed dark purple; the card's white gradient provides contrast.
export function getTimerColor(seconds: number): string {
  if (seconds < 5)  return "hsl(4,   86%, 65%)"  // red
  if (seconds < 10) return "hsl(25,  90%, 62%)"  // orange
  if (seconds < 20) return "hsl(48,  90%, 60%)"  // yellow
  if (seconds < 25) return "hsl(142, 62%, 58%)"  // green
  if (seconds < 40) return "hsl(213, 85%, 65%)"  // light blue
  if (seconds < 60) return "hsl(262, 70%, 70%)"  // light purple
  return                     "hsl(270, 90%, 40%)" // dark purple (60s+)
}
