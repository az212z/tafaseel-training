import { createContext, useContext } from 'react'
import type { LearningState } from './learning'

export const LearningContext = createContext<{
  state: LearningState
  update: (fn: (state: LearningState) => LearningState) => void
  notify: (message: string) => void
} | null>(null)
export function useLearning() {
  const context = useContext(LearningContext)
  if (!context) throw new Error('Learning provider is required')
  return context
}
