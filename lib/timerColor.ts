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

// Static color for stored time entries and stats — darkens monotonically blue→purple over 40–80s.
// Avoids the "lighter = longer" confusion that an arc would create in a list.
export function getTimerColor(seconds: number): string {
  const hue = getTimerHue(seconds)
  if (seconds <= 40) return `hsl(${hue}, 85%, 58%)`
  const t = Math.min((seconds - 40) / 40, 1)
  const saturation = 85 + t * 8   // 85% → 93%
  const lightness = 58 - t * 20   // 58% → 38%
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}
