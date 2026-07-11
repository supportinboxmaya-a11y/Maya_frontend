// Maya offline sync — queue actions while offline, replay when back online.
//
// The mobile/PWA client can't always reach the backend. This module lets
// callers enqueue an action (add memory, create prompt, queue a goal) that
// is stored locally and flushed to POST /api/v1/sync/push once connectivity
// returns. Each action carries a client-generated op_id so the server can
// dedupe replays — safe even if a flaky connection sends a batch twice.

import { agentAPI } from './api'

export interface SyncAction {
  op_id: string
  type: string
  payload: Record<string, unknown>
  client_ts: number
}

const STORAGE_KEY = 'maya_offline_queue'

function uid(): string {
  // op_id: time + random, unique enough to dedupe on the server.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function loadQueue(): SyncAction[] {
  try {
    const raw =
      typeof localStorage !== 'undefined'
        ? localStorage.getItem(STORAGE_KEY)
        : null
    return raw ? (JSON.parse(raw) as SyncAction[]) : []
  } catch {
    return []
  }
}

function saveQueue(queue: SyncAction[]): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
    }
  } catch {
    /* storage full or unavailable — nothing we can do, keep going */
  }
}

/** Queue an action for later sync. Returns its op_id. */
export function enqueue(type: string, payload: Record<string, unknown>): string {
  const action: SyncAction = { op_id: uid(), type, payload, client_ts: Date.now() }
  const queue = loadQueue()
  queue.push(action)
  saveQueue(queue)
  return action.op_id
}

/** How many actions are waiting to sync. */
export function pendingCount(): number {
  return loadQueue().length
}

export function isOnline(): boolean {
  return typeof navigator === 'undefined' ? true : navigator.onLine
}

/**
 * Flush the queue to the server. Applied/skipped/rejected ops are removed
 * (rejected can never succeed on retry); ops that merely failed transiently
 * are kept for the next flush. Returns the server summary, or null if
 * offline / nothing to do.
 */
export async function flush(): Promise<Record<string, number> | null> {
  const queue = loadQueue()
  if (queue.length === 0) return null
  if (!isOnline()) return null

  let res: any
  try {
    res = await agentAPI.syncPush(queue)
  } catch {
    return null // still offline / server unreachable; try again later
  }

  const byId = new Map<string, string>()
  for (const r of res?.results || []) byId.set(r.op_id, r.status)

  // Keep only ops that transiently failed; drop applied/skipped/rejected.
  const remaining = queue.filter((a) => {
    const status = byId.get(a.op_id)
    return status === 'failed'
  })
  saveQueue(remaining)
  return res?.summary ?? null
}

/**
 * Start auto-syncing: flush now, whenever the browser comes back online,
 * and on an interval. Returns a cleanup function.
 */
export function startAutoSync(intervalMs = 30000): () => void {
  const run = () => {
    flush().catch(() => {})
  }
  run()
  const onOnline = () => run()
  if (typeof window !== 'undefined') {
    window.addEventListener('online', onOnline)
  }
  const timer = setInterval(run, intervalMs)
  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', onOnline)
    }
    clearInterval(timer)
  }
}
