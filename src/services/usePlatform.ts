import { useCallback, useEffect, useRef, useState } from 'react'
import { errorMessage, loadPlatform } from './backend'
import type { PlatformData } from './backend'
export function usePlatform(admin = false) {
  const [data, setData] = useState<PlatformData | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    generation = useRef(0)
  const refresh = useCallback(
    async (signal?: AbortSignal) => {
      if (signal?.aborted) return
      const id = ++generation.current
      setLoading(true)
      setError('')
      try {
        const next = await loadPlatform(admin, signal)
        if (id === generation.current && !signal?.aborted) setData(next)
      } catch (e) {
        if (id === generation.current && !signal?.aborted) setError(errorMessage(e))
      } finally {
        if (id === generation.current && !signal?.aborted) setLoading(false)
      }
    },
    [admin],
  )
  useEffect(() => {
    const controller = new AbortController()
    void Promise.resolve().then(() => refresh(controller.signal))
    return () => controller.abort()
  }, [refresh])
  return { data, loading, error, refresh }
}
