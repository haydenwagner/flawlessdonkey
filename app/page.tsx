import Timer from "../components/Timer"
import Nav from "../components/Nav"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8">
      <div className="max-w-md mx-auto">
        <Nav />
        <div className="bg-slate-700 rounded-lg p-8 shadow-xl">
          <Timer />
        </div>
      </div>
    </div>
  )
}