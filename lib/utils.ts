export function formatDuration(ms: number): string {
  return (ms / 1000).toFixed(1)
}

export function formatDateTime(isoString: string): { dateStr: string; timeStr: string } {
  const date = new Date(isoString)
  return {
    dateStr: date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    timeStr: date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
  }
}

export const AVATAR_COLORS = [
  "bg-red-500",
  "bg-orange-500",
  "bg-yellow-500",
  "bg-green-500",
  "bg-teal-500",
  "bg-blue-500",
  "bg-violet-500",
  "bg-pink-500",
]

export function getUserAvatarColor(userId: string): string {
  let hash = 0
  for (const char of userId) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}
