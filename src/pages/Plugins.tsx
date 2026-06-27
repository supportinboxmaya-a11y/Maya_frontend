export function Plugins() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Plugins</h1>
        <p className="text-sm text-slate-400 mt-1">Maya 2.0 ULTRA</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({length: 6}).map((_,i) => (
          <div key={i} className="card p-5 h-32 animate-pulse">
            <div className="h-4 bg-slate-700 rounded w-3/4 mb-3" />
            <div className="h-3 bg-slate-700 rounded w-1/2" />
          </div>
        ))}
      </div>
    </div>
  )
}