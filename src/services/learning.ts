import { questions } from '../data/content'

export type Attempt = { id: string; date: string; questionIds: string[]; answers: number[] }
export type Session = {
  mode: string
  questionIds: string[]
  answers: number[]
  index: number
  checked: boolean
  complete: boolean
  attemptId: string
}
export type Draft = {
  name: string
  phone: string
  program: string
  message: string
  savedAt: string
}
export type LearningState = {
  version: 1
  attempts: Attempt[]
  savedCourses: string[]
  plan: number[]
  draft: Draft | null
  session: Session | null
}
const KEY = 'tafaseel-learning-v1'
export const emptyLearning = (): LearningState => ({
  version: 1,
  attempts: [],
  savedCourses: [],
  plan: [],
  draft: null,
  session: null,
})
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null
const validIds = (v: unknown): v is string[] =>
  Array.isArray(v) &&
  v.length > 0 &&
  v.every((id) => typeof id === 'string' && questions.some((q) => q.id === id))
const validAnswers = (v: unknown): v is number[] =>
  Array.isArray(v) && v.every((a) => Number.isInteger(a) && a >= -1 && a <= 3)

export function validateLearning(value: unknown): LearningState {
  try {
    if (!isRecord(value) || value.version !== 1) return emptyLearning()
    const state = emptyLearning()
    if (Array.isArray(value.savedCourses))
      state.savedCourses = value.savedCourses.filter((id): id is string => typeof id === 'string')
    if (Array.isArray(value.plan))
      state.plan = [
        ...new Set(
          value.plan.filter((id): id is number => Number.isInteger(id) && id >= 0 && id < 7),
        ),
      ]
    if (Array.isArray(value.attempts))
      state.attempts = value.attempts
        .filter(
          (a): a is Attempt =>
            isRecord(a) &&
            typeof a.id === 'string' &&
            typeof a.date === 'string' &&
            !isNaN(Date.parse(a.date)) &&
            validIds(a.questionIds) &&
            validAnswers(a.answers) &&
            a.answers.length === a.questionIds.length &&
            a.answers.every((x) => x >= 0),
        )
        .slice(-30)
    const draft = value.draft
    if (
      isRecord(draft) &&
      ['name', 'phone', 'program', 'message', 'savedAt'].every((k) => typeof draft[k] === 'string')
    )
      state.draft = draft as unknown as Draft
    const s = value.session
    if (
      isRecord(s) &&
      typeof s.mode === 'string' &&
      validIds(s.questionIds) &&
      validAnswers(s.answers) &&
      s.answers.length === s.questionIds.length &&
      Number.isInteger(s.index) &&
      Number(s.index) >= 0 &&
      Number(s.index) < s.questionIds.length &&
      typeof s.checked === 'boolean' &&
      typeof s.complete === 'boolean' &&
      typeof s.attemptId === 'string'
    )
      state.session = s as unknown as Session
    return state
  } catch {
    return emptyLearning()
  }
}

export function readLearning(): LearningState {
  try {
    return validateLearning(JSON.parse(localStorage.getItem(KEY) ?? 'null'))
  } catch {
    return emptyLearning()
  }
}

// Guest-only device persistence. Authenticated learning is stored in PostgreSQL.
export function writeLearning(state: LearningState): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}
export function attemptScore(attempt: Attempt) {
  return attempt.questionIds.reduce(
    (sum, id, i) =>
      sum + (questions.find((q) => q.id === id)?.correct === attempt.answers[i] ? 1 : 0),
    0,
  )
}
export function downloadText(name: string, text: string) {
  const url = URL.createObjectURL(new Blob(['\ufeff', text], { type: 'text/plain;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
export const arNumber = (n: number) => new Intl.NumberFormat('ar-SA').format(n)
