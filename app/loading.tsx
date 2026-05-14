export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white px-8 pt-28 pb-8">
      <div className="max-w-2xl mx-auto animate-pulse">
        <div className="py-8 text-center">
          <div className="h-24 mb-10 flex items-center justify-center">
            <div className="h-16 w-48 bg-slate-700 rounded"></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="h-14 bg-slate-700 rounded-xl"></div>
            <div className="h-14 bg-slate-700 rounded-xl"></div>
          </div>
        </div>
        <div className="mt-4">
          <div className="h-3 bg-slate-700 rounded w-32 mb-4"></div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-slate-700/60 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
