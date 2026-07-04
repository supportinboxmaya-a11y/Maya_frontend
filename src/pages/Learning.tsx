import { useEffect, useState } from 'react'
import { learningAPI } from '@/lib/api'
import { Loader2, GraduationCap, Send, RefreshCw, Star, Archive, History } from 'lucide-react'
import toast from 'react-hot-toast'

interface FeedbackStats { total?: number; average?: number; positive?: number; negative?: number; [k: string]: unknown }
interface LearningStats { feedback?: FeedbackStats; lessons?: unknown[]; prompts?: Record<string, unknown> }
interface ExperienceRow { goal?: string; outcome?: string; confidence?: number; ts?: string; [k: string]: unknown }

export function Learning() {
  const [stats, setStats] = useState<LearningStats | null>(null)
  const [history, setHistory] = useState<ExperienceRow[]>([])
  const [loading, setLoading] = useState(true)

  // feedback form
  const [goal, setGoal] = useState('')
  const [output, setOutput] = useState('')
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // compress
  const [compressing, setCompressing] = useState(false)
  const [compressResult, setCompressResult] = useState<Record<string, unknown> | null>(null)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [s, e] = await Promise.allSettled([
        learningAPI.stats(),
        learningAPI.experience('', 15),
      ])
      if (s.status === 'fulfilled') setStats(s.value as LearningStats)
      if (e.status === 'fulfilled') setHistory(((e.value as any)?.history) || [])
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchAll() }, [])

  const submitFeedback = async () => {
    if (!goal.trim() || rating === 0) return toast.error('Goal and rating are required')
    setSubmitting(true)
    try {
      await learningAPI.feedback(goal, output, rating, comment)
      toast.success('Feedback recorded')
      setGoal(''); setOutput(''); setRating(0); setComment('')
      fetchAll()
    } catch { toast.error('Failed to record feedback') }
    finally { setSubmitting(false) }
  }

  const runCompress = async (dryRun: boolean) => {
    setCompressing(true)
    try {
      const res = await learningAPI.compress('chat', dryRun)
      setCompressResult(res as Record<string, unknown>)
      toast.success(dryRun ? 'Dry run complete' : 'Memory compressed')
    } catch { toast.error('Compression failed') }
    finally { setCompressing(false) }
  }

  const fb = stats?.feedback || {}
  const lessons = (stats?.lessons || []) as any[]
  const prompts = stats?.prompts || {}

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-purple-400"/> Learning Center
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Phase 10 — feedback, experience replay, prompt optimization, compression</p>
        </div>
        <button onClick={fetchAll} className="btn-secondary"><RefreshCw className="w-4 h-4"/>Refresh</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-purple-400"/></div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Feedback', value: fb.total ?? 0 },
              { label: 'Avg Rating', value: fb.average != null ? Number(fb.average).toFixed(2) : '—' },
              { label: 'Lessons Learned', value: lessons.length },
              { label: 'Prompt Variants', value: Object.keys(prompts).length },
            ].map(s => (
              <div key={s.label} className="card p-5">
                <div className="text-xl font-bold text-white font-mono">{String(s.value)}</div>
                <div className="text-xs text-slate-400 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Feedback form */}
            <div className="card p-5 space-y-3">
              <h2 className="text-sm font-semibold text-white">Record Feedback</h2>
              <input value={goal} onChange={e => setGoal(e.target.value)} placeholder="Goal / task..." className="input"/>
              <textarea value={output} onChange={e => setOutput(e.target.value)} placeholder="Agent output (optional)..." rows={2} className="input resize-none"/>
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => setRating(n)}>
                    <Star className={`w-5 h-5 ${n <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`}/>
                  </button>
                ))}
                <span className="text-xs text-slate-500 ml-2">{rating ? `${rating}/5` : 'Rate the result'}</span>
              </div>
              <input value={comment} onChange={e => setComment(e.target.value)} placeholder="Comment (optional)..." className="input"/>
              <button onClick={submitFeedback} disabled={submitting} className="btn-primary">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>}
                Submit Feedback
              </button>
            </div>

            {/* Memory compression */}
            <div className="card p-5 space-y-3">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2"><Archive className="w-4 h-4 text-purple-400"/> Memory Compression</h2>
              <p className="text-xs text-slate-400">Summarize old chat memories into compact digests. Run a dry run first to preview.</p>
              <div className="flex gap-2">
                <button onClick={() => runCompress(true)} disabled={compressing} className="btn-secondary">
                  {compressing ? <Loader2 className="w-4 h-4 animate-spin"/> : null} Dry Run
                </button>
                <button onClick={() => runCompress(false)} disabled={compressing} className="btn-primary">Compress Now</button>
              </div>
              {compressResult && (
                <pre className="text-xs text-slate-300 bg-[#0f1117] border border-[#1e2130] rounded-lg p-3 overflow-x-auto max-h-48">
                  {JSON.stringify(compressResult, null, 2)}
                </pre>
              )}
            </div>
          </div>

          {/* Lessons */}
          <div className="card p-5 space-y-3">
            <h2 className="text-sm font-semibold text-white">Lessons from Low-Rated Runs</h2>
            {lessons.length === 0 ? (
              <p className="text-xs text-slate-500">No lessons yet — record feedback to start learning.</p>
            ) : (
              <div className="space-y-2">
                {lessons.map((l, i) => (
                  <div key={i} className="text-xs text-slate-300 bg-[#0f1117] border border-[#1e2130] rounded-lg p-3">
                    {typeof l === 'string' ? l : JSON.stringify(l)}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Experience history */}
          <div className="card p-5 space-y-3">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2"><History className="w-4 h-4 text-purple-400"/> Experience Replay</h2>
            {history.length === 0 ? (
              <p className="text-xs text-slate-500">No autonomous runs recorded yet. Runs feed experience replay automatically.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-500 text-left border-b border-[#1e2130]">
                      <th className="py-2 pr-4">Goal</th>
                      <th className="py-2 pr-4">Outcome</th>
                      <th className="py-2 pr-4">Confidence</th>
                      <th className="py-2">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((r, i) => (
                      <tr key={i} className="border-b border-[#1e2130]/50 text-slate-300">
                        <td className="py-2 pr-4 max-w-xs truncate">{r.goal || '—'}</td>
                        <td className="py-2 pr-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            r.outcome === 'success' ? 'bg-emerald-500/15 text-emerald-400' :
                            r.outcome === 'failed' ? 'bg-red-500/15 text-red-400' : 'bg-slate-500/15 text-slate-400'
                          }`}>{r.outcome || '?'}</span>
                        </td>
                        <td className="py-2 pr-4 font-mono">{r.confidence != null ? Number(r.confidence).toFixed(2) : '—'}</td>
                        <td className="py-2 text-slate-500">{r.ts ? String(r.ts).slice(0, 19).replace('T', ' ') : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
