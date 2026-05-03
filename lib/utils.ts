export function formatDuration(ms: number): string {
  return (ms / 1000).toFixed(1)
}

export function formatDateTime(isoString: string): { dateStr: string; timeStr: string } {
  // Ensure the string is parsed as UTC — append Z if no timezone offset is present
  const normalized = /[Zz]$|[+-]\d{2}:\d{2}$/.test(isoString) ? isoString : isoString + "Z"
  const d = new Date(normalized)
  if (isNaN(d.getTime())) return { dateStr: "—", timeStr: "—" }
  // Use date getters — these always return values in the LOCAL timezone, unlike toLocaleTimeString
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const h = d.getHours()
  const h12 = h % 12 || 12
  const ampm = h < 12 ? "AM" : "PM"
  const pad = (n: number) => n.toString().padStart(2, "0")
  return {
    dateStr: `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`,
    timeStr: `${h12}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${ampm}`,
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
