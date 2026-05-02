import Timer from "../components/Timer"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8">
      <div className="max-w-md mx-auto mt-20">
        <h1 className="text-5xl font-bold mb-8 text-center">Flawless Donkey</h1>
        <div className="bg-slate-700 rounded-lg p-8 shadow-xl">
          <Timer />
        </div>
      </div>
    </div>
  )
}