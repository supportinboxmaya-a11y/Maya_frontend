import { Orb } from "@/components/maya/Orb"

export function Tasks() {
  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 m-rise">
      <div className="flex items-center gap-3 mb-6">
        <Orb size={32} />
        <h1 className="m-display text-2xl font-semibold m-ink">Tasks</h1>
      </div>
      <div className="m-card p-8 text-center">
        <div className="text-sm m-muted">Your tasks will appear here.</div>
      </div>
    </div>
  )
}
