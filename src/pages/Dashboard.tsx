import { useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  BookmarkSimple,
  Check,
  CheckCircle,
  DownloadSimple,
  Target,
  Trash,
  TrendUp,
} from '@phosphor-icons/react'
import { CourseCard, LocalNotice, PageHeading } from '../components/Shared'
import { courses, weekPlan } from '../data/content'
import { useLearning } from '../services/context'
import { arNumber, attemptScore, downloadText } from '../services/learning'

export default function Dashboard() {
  const { state, update, notify } = useLearning()
  const dialog = useRef<HTMLDialogElement>(null)
  const attemptedCount = state.attempts.reduce((n, a) => n + a.questionIds.length, 0)
  const correctCount = state.attempts.reduce((n, a) => n + attemptScore(a), 0)
  const saved = courses.filter((c) => state.savedCourses.includes(c.id))
  const downloadPlan = () =>
    downloadText(
      'خطة-تفاصيل-الأسبوعية.txt',
      'مركز تفاصيل للتدريب\nخطة أسبوعية مقترحة\nعدّل وقت الجلسة بحسب ظروفك ومستواك.\n\n' +
        weekPlan
          .map(
            (day, i) =>
              `${state.plan.includes(i) ? '✓' : '□'} ${day.day}: ${day.title}\n${day.detail}`,
          )
          .join('\n\n'),
    )
  return (
    <>
      <PageHeading
        eyebrow="مساحة المتدرب"
        title="أهلًا بطموحك."
        description="كل محاولة تضيف إلى فهمك. تابع ما أنجزته، وابدأ خطوتك التالية."
      />
      <div className="container page-content dashboard">
        <LocalNotice />
        <div className="dashboard-stats">
          <div>
            <Target size={25} />
            <span>تدريبات مكتملة</span>
            <strong>{arNumber(state.attempts.length)}</strong>
          </div>
          <div>
            <CheckCircle size={25} />
            <span>أسئلة أجبت عنها</span>
            <strong>{arNumber(attemptedCount)}</strong>
          </div>
          <div>
            <TrendUp size={25} />
            <span>إجابات صحيحة</span>
            <strong>
              {arNumber(correctCount)}
              <small>
                {attemptedCount > 0 ? `من ${arNumber(attemptedCount)}` : 'ابدأ أول تدريب'}
              </small>
            </strong>
          </div>
          <div>
            <BookmarkSimple size={25} />
            <span>مسارات محفوظة</span>
            <strong>{arNumber(saved.length)}</strong>
          </div>
        </div>
        <div className="dashboard-next">
          <div>
            <span className="eyebrow">خطوتك القادمة</span>
            <h2>
              {state.session && !state.session.complete
                ? 'تدريبك ينتظرك. أكمل من حيث توقفت.'
                : state.attempts.length
                  ? 'مراجعة قصيرة، وفهم أعمق.'
                  : 'ابدأ أول تدريب، وتعرّف على مهاراتك.'}
            </h2>
            <p>أسئلة كمية ولفظية مع شرح يساعدك على فهم طريقة الحل.</p>
          </div>
          <Link className="button" to="/practice">
            {state.session && !state.session.complete ? 'أكمل التدريب' : 'ابدأ التدريب'}
            <ArrowLeft size={20} />
          </Link>
        </div>
        <div className="dashboard-columns">
          <section className="dashboard-panel">
            <div className="panel-title">
              <div>
                <h2>خطتك لهذا الأسبوع</h2>
                <p>خطة مقترحة. علّم على ما أنجزته.</p>
              </div>
              <button
                className="icon-button"
                aria-label="تحميل الخطة الأسبوعية"
                onClick={downloadPlan}
              >
                <DownloadSimple />
              </button>
            </div>
            <div className="plan-progress">
              <span>
                {arNumber(state.plan.length)} من {arNumber(weekPlan.length)} جلسات مكتملة
              </span>
              <progress
                value={state.plan.length}
                max={weekPlan.length}
                aria-label="إنجاز خطة المذاكرة"
              />
            </div>
            <div className="weekly-plan">
              {weekPlan.map((day, i) => (
                <label key={day.day} className={state.plan.includes(i) ? 'done' : ''}>
                  <input
                    type="checkbox"
                    checked={state.plan.includes(i)}
                    onChange={() =>
                      update((s) => ({
                        ...s,
                        plan: s.plan.includes(i) ? s.plan.filter((n) => n !== i) : [...s.plan, i],
                      }))
                    }
                  />
                  <span className="plan-checkbox">
                    {state.plan.includes(i) && <Check size={16} />}
                  </span>
                  <span className="day-name">{day.day}</span>
                  <span>{day.title}</span>
                </label>
              ))}
            </div>
          </section>
          <section className="dashboard-panel">
            <div className="panel-title">
              <div>
                <h2>سجل تدريباتك</h2>
                <p>آخر المحاولات المكتملة على هذا الجهاز.</p>
              </div>
              <TrendUp size={25} />
            </div>
            {state.attempts.length ? (
              <div className="attempt-list">
                {[...state.attempts]
                  .reverse()
                  .slice(0, 6)
                  .map((a, i) => (
                    <article key={a.id}>
                      <span className="attempt-icon">
                        <Target size={24} />
                      </span>
                      <div>
                        <h3>
                          تدريب{' '}
                          {a.questionIds.length === 8
                            ? 'كمي ولفظي'
                            : a.questionIds[0] === 'q1'
                              ? 'كمي'
                              : 'لفظي'}
                        </h3>
                        <p>
                          {new Intl.DateTimeFormat('ar-SA', {
                            dateStyle: 'medium',
                            calendar: 'gregory',
                          }).format(new Date(a.date))}
                          {i === 0 && <span>الأحدث</span>}
                        </p>
                      </div>
                      <strong>
                        {arNumber(attemptScore(a))}
                        <small> / {arNumber(a.questionIds.length)}</small>
                      </strong>
                    </article>
                  ))}
              </div>
            ) : (
              <div className="empty-state compact-empty">
                <Target size={46} weight="light" />
                <h3>محاولتك الأولى تصنع البداية</h3>
                <p>بعد إكمال التدريب، ستجد نتيجتك هنا.</p>
                <Link className="text-link" to="/practice">
                  جرّب الآن <ArrowLeft size={18} />
                </Link>
              </div>
            )}
          </section>
        </div>
        <section className="dashboard-saved">
          <div className="section-heading">
            <div>
              <h2>مساراتك المحفوظة</h2>
              <p>احتفظ بما يهمك، وعد إليه عندما تكون مستعدًا.</p>
            </div>
            <Link className="text-link" to="/programs">
              استكشف البرامج <ArrowLeft size={18} />
            </Link>
          </div>
          {saved.length ? (
            <div className="programs-grid">
              {saved.map((c) => (
                <CourseCard key={c.id} course={c} />
              ))}
            </div>
          ) : (
            <div className="saved-empty">
              <BookmarkSimple size={26} />
              <span>لم تحفظ أي مسار بعد. اضغط علامة الحفظ بجانب البرنامج ليظهر هنا.</span>
            </div>
          )}
        </section>
        {state.draft && (
          <section className="draft-summary">
            <div>
              <h2>مسودة استفسارك</h2>
              <p>محفوظة على جهازك، ولم تُرسل إلى المركز.</p>
            </div>
            <Link to="/contact" className="text-link">
              عرض المسودة وتعديلها <ArrowLeft size={18} />
            </Link>
          </section>
        )}
        <div className="data-controls">
          <p>يمكنك مسح بيانات هذه المساحة في أي وقت.</p>
          <button className="text-link" onClick={() => dialog.current?.showModal()}>
            <Trash size={18} />
            مسح بياناتي المحلية
          </button>
        </div>
      </div>
      <dialog ref={dialog} className="confirm-dialog" aria-labelledby="clear-data-heading">
        <h2 id="clear-data-heading">مسح بيانات هذا الجهاز؟</h2>
        <p>
          سيُحذف تقدم التدريب والمحاولات والمسارات المحفوظة ومسودة الاستفسار. لا يمكن التراجع عن هذه
          الخطوة.
        </p>
        <div>
          <button className="button" onClick={() => dialog.current?.close()}>
            الاحتفاظ ببياناتي
          </button>
          <button
            className="button button-outline"
            onClick={() => {
              update(() => ({
                version: 1,
                attempts: [],
                savedCourses: [],
                plan: [],
                draft: null,
                session: null,
              }))
              dialog.current?.close()
              notify('تم مسح بياناتك المحلية.')
            }}
          >
            مسح البيانات
          </button>
        </div>
      </dialog>
    </>
  )
}
