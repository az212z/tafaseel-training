import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { LearningContext } from './context'
import { emptyLearning, readLearning, validateLearning, writeLearning } from './learning'
import type { LearningState } from './learning'
import { supabase } from './backend'
import { useAuth } from '../auth/context'
export default function LearningProvider({
  children,
  notify,
  onStorageError,
}: {
  children: ReactNode
  notify: (message: string) => void
  onStorageError: (failed: boolean) => void
}) {
  const { user, loading: authLoading } = useAuth(),
    [state, setState] = useState(() => (user ? emptyLearning() : readLearning())),
    [syncState, setSyncState] = useState<'loading' | 'saved' | 'saving' | 'error'>(
      user ? 'loading' : 'saved',
    ),
    stateRef = useRef(state),
    ready = useRef(!user),
    revision = useRef(0),
    [loadAttempt, setLoadAttempt] = useState(0),
    queue = useRef(Promise.resolve())
  const userId = user?.id
  useEffect(() => {
    if (!userId) return
    let alive = true
    void supabase
      .from('learning_states')
      .select('state')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!alive) return
        if (error) {
          setSyncState('error')
          return
        }
        const next = data ? validateLearning(data.state) : emptyLearning()
        stateRef.current = next
        setState(next)
        ready.current = true
        setSyncState('saved')
      })
    return () => {
      alive = false
    }
  }, [userId, loadAttempt])
  const save = (next: LearningState) => {
    if (!userId) return
    const attempt = ++revision.current
    setSyncState('saving')
    queue.current = queue.current.then(async () => {
      try {
        const { error } = await supabase
          .from('learning_states')
          .upsert({ user_id: userId, state: next })
        if (error) throw error
        if (attempt === revision.current) setSyncState('saved')
      } catch {
        if (attempt === revision.current) {
          setSyncState('error')
          notify('تعذّر حفظ التقدم في حسابك. أعد المحاولة قبل مغادرة الصفحة.')
        }
      }
    })
  }
  const retrySync = () => {
    if (ready.current) save(stateRef.current)
    else {
      setSyncState('loading')
      setLoadAttempt((attempt) => attempt + 1)
    }
  }
  const update = (fn: (s: LearningState) => LearningState) => {
    if (authLoading || !ready.current) {
      notify('انتظر حتى يكتمل تحميل تقدمك، ثم حاول مجددًا.')
      return
    }
    const next = fn(stateRef.current)
    stateRef.current = next
    setState(next)
    if (!user) {
      onStorageError(!writeLearning(next))
      return
    }
    save(next)
  }
  return (
    <LearningContext.Provider value={{ state, update, notify, syncState, retrySync }}>
      {children}
    </LearningContext.Provider>
  )
}
