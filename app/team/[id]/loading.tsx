export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white px-8 pt-28 pb-8">
      <div className="max-w-2xl mx-auto animate-pulse">
        <div className="h-9 bg-slate-700 rounded w-48 mb-3"></div>
        <div className="h-6 bg-slate-700 rounded w-32 mb-8"></div>
        <div className="grid grid-cols-2 gap-4 mb-8">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-slate-700/60 rounded-2xl h-24"></div>
          ))}
        </div>
        <div className="space-y-3 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 bg-slate-700/60 rounded-2xl"></div>
          ))}
        </div>
        <div className="h-24 bg-slate-700/60 rounded-2xl mb-8"></div>
        <div className="h-3 bg-slate-700 rounded w-24 mb-4"></div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-slate-700/60 rounded-2xl"></div>
          ))}
        </div>
      </div>
    </div>
  )
}
