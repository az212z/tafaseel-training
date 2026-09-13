import { useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  ArrowCounterClockwise,
  BookOpen,
  Check,
  CheckCircle,
  ClipboardText,
  Clock,
  Lightbulb,
  Target,
  XCircle,
} from '@phosphor-icons/react'
import { LocalNotice, PageHeading } from '../components/Shared'
import { questions } from '../data/content'
import { useLearning } from '../services/context'
import { arNumber, attemptScore } from '../services/learning'
import type { Session } from '../services/learning'

export default function Practice() {
  const { state, update } = useLearning()
  const [params] = useSearchParams()
  const [mode, setMode] = useState(() =>
    ['quantitative', 'verbal'].includes(params.get('mode') || '') ? params.get('mode')! : 'all',
  )
  const [selectionError, setSelectionError] = useState(false)
  const resetDialog = useRef<HTMLDialogElement>(null)
  const session = state.session
  const items = session ? session.questionIds.map((id) => questions.find((q) => q.id === id)!) : []
  const question = session ? items[session.index] : null
  const selected = session ? session.answers[session.index] : -1
  const start = () => {
    const list = questions.filter(
      (q) => mode === 'all' || q.category === (mode === 'quantitative' ? 'كمي' : 'لفظي'),
    )
    const next: Session = {
      mode,
      questionIds: list.map((q) => q.id),
      answers: list.map(() => -1),
      index: 0,
      checked: false,
      complete: false,
      attemptId: crypto.randomUUID(),
    }
    update((s) => ({ ...s, session: next }))
    setSelectionError(false)
  }
  const choose = (index: number) => {
    if (!session || session.checked) return
    update((s) => ({
      ...s,
      session: {
        ...session,
        answers: session.answers.map((a, i) => (i === session.index ? index : a)),
      },
    }))
    setSelectionError(false)
  }
  const check = () => {
    if (!session) return
    if (selected < 0) {
      setSelectionError(true)
      return
    }
    update((s) => ({ ...s, session: { ...session, checked: true } }))
  }
  const next = () => {
    if (!session || !session.checked) return
    if (session.index === items.length - 1) {
      const attempt = {
        id: session.attemptId,
        date: new Date().toISOString(),
        questionIds: session.questionIds,
        answers: session.answers,
      }
      update((s) => ({
        ...s,
        session: { ...session, complete: true },
        attempts: s.attempts.some((a) => a.id === attempt.id)
          ? s.attempts
          : [...s.attempts.slice(-29), attempt],
      }))
    } else
      update((s) => ({ ...s, session: { ...session, index: session.index + 1, checked: false } }))
    document.getElementById('question-heading')?.focus()
  }
  const reset = () => {
    update((s) => ({ ...s, session: null }))
    resetDialog.current?.close()
    setSelectionError(false)
  }
  const score = session
    ? attemptScore({ id: '', date: '', questionIds: session.questionIds, answers: session.answers })
    : 0
  return (
    <>
      <PageHeading
        eyebrow="التدريب التفاعلي"
        title={session?.complete ? 'كل إجابة، فرصة للفهم.' : 'جرّب. افهم. ثم تقدّم.'}
        description="أسئلة قصيرة مع شرح مباشر. امنح نفسك وقتًا للتفكير، ثم راجع طريقة الحل."
      />
      <section className="container practice-page page-content">
        <LocalNotice />
        {!session ? (
          <div className="practice-start">
            <div className="practice-start-art">
              <Target size={100} weight="thin" />
              <h2>
                ابدأ من
                <br />
                <span>سؤال واحد.</span>
              </h2>
              <p>التعلّم يبدأ بالمحاولة.</p>
            </div>
            <div className="practice-setup">
              <span className="eyebrow">اختر تدريبك</span>
              <h2>على ماذا تريد أن تركز؟</h2>
              <div className="practice-modes" role="group" aria-label="نوع التدريب">
                {[
                  ['all', 'كمي ولفظي', '٨ أسئلة متنوعة'],
                  ['quantitative', 'القدرات الكمي', '٤ أسئلة كمية'],
                  ['verbal', 'القدرات اللفظي', '٤ أسئلة لفظية'],
                ].map(([value, title, subtitle]) => (
                  <button
                    key={value}
                    aria-pressed={mode === value}
                    className={mode === value ? 'selected' : ''}
                    onClick={() => setMode(value)}
                  >
                    <span className="radio-mark">{mode === value && <span />}</span>
                    <span>
                      <strong>{title}</strong>
                      <small>{subtitle}</small>
                    </span>
                    {mode === value && <Check size={21} />}
                  </button>
                ))}
              </div>
              <div className="practice-facts">
                <span>
                  <Clock size={18} />
                  بلا حد زمني
                </span>
                <span>
                  <Lightbulb size={18} />
                  شرح لكل إجابة
                </span>
              </div>
              <button className="button full-width" onClick={start}>
                ابدأ التدريب <ArrowLeft size={20} />
              </button>
              <p className="muted-note">
                تدريب تعليمي توضيحي، ولا يمثل اختبارًا رسميًا أو توقعًا لدرجتك.
              </p>
            </div>
          </div>
        ) : session.complete ? (
          <div className="practice-results">
            <div className="result-summary">
              <div className="result-circle">
                <span>
                  {arNumber(score)}
                  <small> / {arNumber(items.length)}</small>
                </span>
                <p>إجابات صحيحة</p>
              </div>
              <div>
                <span className="eyebrow">أنهيت التدريب</span>
                <h2>
                  {score === items.length
                    ? 'أحسنت. فهمٌ يستحق البناء عليه.'
                    : 'محاولة جيدة. والمراجعة تصنع الفرق.'}
                </h2>
                <p>راجع شرح الإجابات أدناه، وخصص جلستك القادمة للمهارات التي تحتاج إلى تطويرها.</p>
                <div className="result-actions">
                  <Link className="button" to="/dashboard">
                    شاهد تقدمك <ArrowLeft size={19} />
                  </Link>
                  <button className="button button-outline" onClick={reset}>
                    <ArrowCounterClockwise size={19} />
                    تدريب جديد
                  </button>
                </div>
              </div>
            </div>
            <h2 className="review-heading">مراجعة الإجابات</h2>
            <div className="answer-review">
              {items.map((q, i) => (
                <details key={q.id} open={session.answers[i] !== q.correct}>
                  <summary>
                    {session.answers[i] === q.correct ? (
                      <CheckCircle className="correct-color" size={24} />
                    ) : (
                      <XCircle className="incorrect-color" size={24} />
                    )}
                    <span>
                      {q.text}
                      <small>
                        {q.category} / {q.skill}
                      </small>
                    </span>
                    <span className="review-answer">{q.options[session.answers[i]]}</span>
                  </summary>
                  <div>
                    <p>
                      <strong>الإجابة الصحيحة: {q.options[q.correct]}</strong>
                    </p>
                    <p>{q.explanation}</p>
                  </div>
                </details>
              ))}
            </div>
            <p className="muted-note">
              هذه النتيجة تخص التدريب الحالي فقط، ولا تتنبأ بدرجة اختبار القدرات.
            </p>
          </div>
        ) : (
          question && (
            <div className="quiz-layout">
              <aside className="quiz-sidebar">
                <BookOpen size={30} weight="duotone" />
                <h2>تدريبك الحالي</h2>
                <p>
                  {session.mode === 'all'
                    ? 'كمي ولفظي'
                    : session.mode === 'verbal'
                      ? 'القدرات اللفظي'
                      : 'القدرات الكمي'}
                </p>
                <div className="quiz-steps" aria-label="تقدم الأسئلة">
                  {items.map((q, i) => (
                    <span
                      key={q.id}
                      className={`${i === session.index ? 'current' : ''} ${i < session.index ? 'finished' : ''}`}
                      aria-current={i === session.index ? 'step' : undefined}
                    >
                      {i < session.index ? <Check size={17} /> : arNumber(i + 1)}
                    </span>
                  ))}
                </div>
                <div className="quiz-sidebar-note">
                  <Lightbulb size={23} />
                  <p>لا تستعجل الإجابة. اقرأ المعطيات وحدد المطلوب أولًا.</p>
                </div>
                <button className="text-link" onClick={() => resetDialog.current?.showModal()}>
                  <ArrowRight size={18} />
                  إنهاء هذه المحاولة
                </button>
              </aside>
              <div className="quiz-card">
                <div className="quiz-card-top">
                  <span className="tag">
                    {question.category} / {question.skill}
                  </span>
                  <span>
                    السؤال {arNumber(session.index + 1)} من {arNumber(items.length)}
                  </span>
                </div>
                <div
                  className="quiz-progress"
                  role="progressbar"
                  aria-label="تقدم التدريب"
                  aria-valuenow={session.index + (session.checked ? 1 : 0)}
                  aria-valuemin={0}
                  aria-valuemax={items.length}
                >
                  <span
                    style={{
                      width: `${((session.index + (session.checked ? 1 : 0)) / items.length) * 100}%`,
                    }}
                  />
                </div>
                <h2 id="question-heading" tabIndex={-1}>
                  {question.text}
                </h2>
                <div className="quiz-options" role="group" aria-label="خيارات الإجابة">
                  {question.options.map((option, i) => (
                    <button
                      key={option}
                      aria-pressed={selected === i}
                      disabled={session.checked}
                      className={`${selected === i ? 'selected' : ''} ${session.checked && i === question.correct ? 'correct' : ''} ${session.checked && selected === i && i !== question.correct ? 'incorrect' : ''}`}
                      onClick={() => choose(i)}
                    >
                      <span className="option-letter">{['أ', 'ب', 'ج', 'د'][i]}</span>
                      <span>{option}</span>
                      {session.checked && i === question.correct && <CheckCircle size={23} />}
                      {session.checked && selected === i && i !== question.correct && (
                        <XCircle size={23} />
                      )}
                    </button>
                  ))}
                </div>
                {selectionError && (
                  <p className="field-error" role="alert">
                    اختر إجابة قبل التحقق.
                  </p>
                )}
                {session.checked && (
                  <div
                    className={`answer-explanation ${selected === question.correct ? 'correct' : 'incorrect'}`}
                    role="status"
                  >
                    <Lightbulb size={25} />
                    <div>
                      <h3>
                        {selected === question.correct
                          ? 'إجابة صحيحة. أحسنت!'
                          : 'لنتعلّم من هذه المحاولة.'}
                      </h3>
                      <p>{question.explanation}</p>
                    </div>
                  </div>
                )}
                <div className="quiz-bottom">
                  <span>
                    <ClipboardText size={18} />
                    {session.checked ? 'راجع الفكرة قبل المتابعة' : 'اختر الإجابة الأنسب'}
                  </span>
                  <button className="button" onClick={session.checked ? next : check}>
                    {session.checked
                      ? session.index === items.length - 1
                        ? 'عرض النتيجة'
                        : 'السؤال التالي'
                      : 'تحقق من الإجابة'}
                    <ArrowLeft size={19} />
                  </button>
                </div>
              </div>
            </div>
          )
        )}
      </section>
      <dialog ref={resetDialog} className="confirm-dialog" aria-labelledby="end-attempt-heading">
        <h2 id="end-attempt-heading">إنهاء المحاولة الحالية؟</h2>
        <p>ستُحذف إجابات هذه المحاولة غير المكتملة. نتائج تدريباتك السابقة ستبقى محفوظة.</p>
        <div>
          <button className="button" onClick={() => resetDialog.current?.close()}>
            متابعة التدريب
          </button>
          <button className="button button-outline" onClick={reset}>
            إنهاء المحاولة
          </button>
        </div>
      </dialog>
    </>
  )
}
